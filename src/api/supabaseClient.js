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

// Make sure array/object fields always have the shape the UI expects (prevents "x.map is not a function").
const parse = (v) => { if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } } return v; };
const ARR = ['content_blocks', 'tags', 'models', 'pinned_facts'];
const normalize = (row) => {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const r = { ...row };
  for (const k of ARR) if (k in r || k === 'content_blocks' || k === 'tags') {
    let v = parse(r[k]);
    if (typeof v === 'string' && k === 'tags') v = v.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
    r[k] = Array.isArray(v) ? v : [];
  }
  const m = parse(r.metadata);
  r.metadata = m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  return r;
};
const toRows = (r) => (Array.isArray(r) ? r : Array.isArray(r?.rows) ? r.rows : []);

const api = (action, table, extra = {}) => callFunction('dataapi', { action, table, ...extra });
const entity = (table) => ({
  list: async (sortBy) => toRows(await api('list', table, { sortBy })).map(normalize),
  filter: async (where = {}, sortBy) => toRows(await api('list', table, { sortBy })).map(normalize)
    .filter((row) => Object.entries(where).every(([k, v]) => row[k] === v)),
  create: async (data) => normalize(await api('create', table, { data })),
  update: async (id, data) => normalize(await api('update', table, { id, data })),
  delete: (id) => api('delete', table, { id }),
  get: async (id) => normalize(await api('get', table, { id })),
});
const notSupported = async () => { throw new Error('לא נתמך אחרי המעבר ל-Neon'); };

export const base44 = {
  entities: {
    Card: entity('cards'), Folder: entity('folders'), Tag: entity('tags'),
    ApiTemplate: { list: async () => [], filter: async () => [] },
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
