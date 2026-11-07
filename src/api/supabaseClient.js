// Data client - now talks to Neon Functions (dataapi). File name/exports kept so the app is unchanged.
import { neonAuth } from './neonAuth';

export const functionUrl = (slug) =>
  import.meta.env[`VITE_FN_${slug.toUpperCase()}_URL`] ||
  `https://br-shiny-paper-befmfejt-${slug}.compute.c-9.us-east-2.aws.neon.tech/`;

export const callFunction = async (slug, body) => {
  const token = await neonAuth.getToken();
  const res = await fetch(functionUrl(slug), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result.error || 'API call failed');
  return result;
};

const api = (action, table, extra = {}) => callFunction('dataapi', { action, table, ...extra });
const entity = (table) => ({
  list: (sortBy) => api('list', table, { sortBy }),
  create: (data) => api('create', table, { data }),
  update: (id, data) => api('update', table, { id, data }),
  delete: (id) => api('delete', table, { id }),
  get: (id) => api('get', table, { id }),
});
const notSupported = async () => { throw new Error('לא נתמך אחרי המעבר ל-Neon'); };

export const base44 = {
  entities: {
    Card: entity('cards'), Folder: entity('folders'), Tag: entity('tags'),
    ApiTemplate: { list: async () => [] },
  },
  auth: {
    me: () => api('getProfile', null),
    getProfile: () => api('getProfile', null),
    updateProfile: ({ full_name }) => api('updateProfile', null, { data: { full_name } }),
    logout: () => neonAuth.signOut(),
    getSessionToken: () => null,
    setPin: notSupported, verifyPin: notSupported, clearPin: notSupported,
    requestPinReset: notSupported, verifyPinResetOtp: notSupported,
  },
};
export default base44;
