import { callFunction } from './supabaseClient';
const ai = (action, extra = {}) => callFunction('aichat', { action, ...extra });
export const aiClient = {
  listProviders: () => ai('listProviders'),
  saveProvider: (p) => ai('saveProvider', p),
  deleteProvider: (id) => ai('deleteProvider', { id }),
  history: (card_id) => ai('history', { card_id }),
  clear: (card_id) => ai('clear', { card_id }),
  send: (card_id, message, provider_id, model) => ai('send', { card_id, message, provider_id, model }),
};
