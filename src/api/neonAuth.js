// Neon Auth (Better Auth) client. Set VITE_NEON_AUTH_URL to NEON_AUTH_BASE_URL from .env.local.
const AUTH_URL = (import.meta.env.VITE_NEON_AUTH_URL || '').replace(/\/$/, '');

const call = async (path, { method = 'GET', body } = {}) => {
  const res = await fetch(`${AUTH_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `Auth error ${res.status}`);
  return data;
};

let cached = null;

export const neonAuth = {
  signUp: (email, password, name) => call('/sign-up/email', { method: 'POST', body: { email, password, name: name || email } }),
  signIn: (email, password) => call('/sign-in/email', { method: 'POST', body: { email, password } }),
  signOut: async () => { cached = null; try { await call('/sign-out', { method: 'POST', body: {} }); } catch { /* ignore */ } },
  getSession: async () => { try { return await call('/get-session'); } catch { return null; } },
  // Short-lived JWT for Neon Functions (verified there against NEON_AUTH_JWKS_URL)
  getToken: async () => {
    if (cached && cached.exp > Date.now() + 30000) return cached.token;
    const { token } = await call('/token');
    if (!token) throw new Error('Not authenticated');
    let exp = Date.now() + 300000;
    try { exp = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; } catch { /* default */ }
    cached = { token, exp };
    return token;
  },
};
