// Hidden per-card AI chat. Any OpenAI-compatible provider. Keys stay server-side (AES-GCM).
// If a model fails, the next one is tried automatically.
import { sql, json, cors, fail, requireApprovedUser } from './_auth';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

// Key derived server-side: AI_KEYS_SECRET if set, otherwise DATABASE_URL (never leaves the server).
const KEY = createHash('sha256').update(process.env.AI_KEYS_SECRET || process.env.DATABASE_URL || 'cardxflow').digest();
const enc = (s: string) => { const iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', KEY, iv);
  const d = Buffer.concat([c.update(s, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), d].map(b => b.toString('base64')).join('.'); };
const dec = (s: string) => { const [iv, tag, d] = s.split('.').map(x => Buffer.from(x, 'base64'));
  const c = createDecipheriv('aes-256-gcm', KEY, iv); c.setAuthTag(tag);
  return Buffer.concat([c.update(d), c.final()]).toString('utf8'); };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const user = await requireApprovedUser(req);
    const b = await req.json();
    switch (b.action) {
      case 'listProviders':
        return json(await sql`select id, name, base_url, models, is_default from ai_providers where user_id=${user.id} order by created_date`);
      case 'saveProvider': {
        const k = b.api_key ? enc(b.api_key) : null;
        const models = JSON.stringify(b.models || []);
        const r = b.id
          ? await sql`update ai_providers set name=${b.name}, base_url=${b.base_url}, models=${models}, is_default=${!!b.is_default},
                      api_key_encrypted=coalesce(${k}, api_key_encrypted), updated_date=now()
                      where id=${b.id} and user_id=${user.id} returning id`
          : await sql`insert into ai_providers (user_id, name, base_url, api_key_encrypted, models, is_default)
                      values (${user.id}, ${b.name}, ${b.base_url}, ${k}, ${models}, ${!!b.is_default}) returning id`;
        return json(r[0]);
      }
      case 'deleteProvider':
        await sql`delete from ai_providers where id=${b.id} and user_id=${user.id}`;
        return json({ success: true });
      case 'history':
        return json(await sql`select id, role, content, model, created_date from card_ai_messages
                              where card_id=${b.card_id} and user_id=${user.id} order by created_date`);
      case 'clear':
        await sql`delete from card_ai_messages where card_id=${b.card_id} and user_id=${user.id}`;
        await sql`delete from card_ai_memory where card_id=${b.card_id} and user_id=${user.id}`;
        return json({ success: true });
      case 'send':
        return json(await send(user.id, b));
      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (e: any) {
    return json({ error: e.message }, e.status || 500);
  }
}

async function callModel(p: any, model: string, messages: any[]) {
  const r = await fetch(`${p.base_url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
      ...(p.api_key_encrypted ? { Authorization: `Bearer ${dec(p.api_key_encrypted)}` } : {}) },
    body: JSON.stringify({ model, messages }),
  });
  const j: any = await r.json().catch(() => ({}));
  const text = j?.choices?.[0]?.message?.content;
  if (!r.ok || !text) throw new Error(j?.error?.message || `HTTP ${r.status}`);
  return { text: String(text), tokens: j?.usage?.total_tokens ?? null };
}

async function send(userId: string, { card_id, message, provider_id, model }: any) {
  const [card] = await sql`select title, content_blocks from cards where id=${card_id} and user_id=${userId}`;
  if (!card) throw fail('Card not found', 404);
  const [mem] = await sql`select summary, pinned_facts from card_ai_memory where card_id=${card_id}`;
  const recent = (await sql`select role, content from card_ai_messages where card_id=${card_id} and user_id=${userId}
                            order by created_date desc limit 20`).reverse();

  // Chosen model first, then all other models by provider order + priority
  const providers = await sql`select * from ai_providers where user_id=${userId} order by is_default desc, created_date`;
  const cands: { p: any; m: string }[] = [];
  for (const p of providers)
    for (const m of [...(p.models || [])].sort((a: any, x: any) => (a.priority ?? 0) - (x.priority ?? 0)))
      cands.push({ p, m: m.id });
  const isChosen = (c: any) => c.p.id === provider_id && c.m === model ? 1 : 0;
  cands.sort((a, c) => isChosen(c) - isChosen(a));
  if (!cands.length) throw fail('No AI provider configured', 400);

  const system = `You are an assistant inside the card "${card.title}". Answer in the user's language.\n` +
    `Card content:\n${JSON.stringify(card.content_blocks).slice(0, 12000)}\n` +
    (mem?.summary ? `Earlier conversation summary:\n${mem.summary}\n` : '') +
    (mem?.pinned_facts?.length ? `Pinned facts:\n- ${mem.pinned_facts.join('\n- ')}\n` : '');
  const messages = [{ role: 'system', content: system }, ...recent, { role: 'user', content: message }];

  const errors: string[] = [];
  for (const c of cands) {
    try {
      const out = await callModel(c.p, c.m, messages);
      await sql`insert into card_ai_messages (card_id, user_id, role, content) values (${card_id}, ${userId}, 'user', ${message})`;
      await sql`insert into card_ai_messages (card_id, user_id, role, content, model, tokens)
                values (${card_id}, ${userId}, 'assistant', ${out.text}, ${c.m}, ${out.tokens})`;
      if (recent.length >= 20) await summarize(userId, card_id, c, mem?.summary || '', recent);
      return { reply: out.text, model: c.m, provider: c.p.name };
    } catch (e: any) { errors.push(`${c.p.name}/${c.m}: ${e.message}`); }
  }
  throw fail(`All models failed: ${errors.join(' | ')}`, 502);
}

// Rolling memory: fold older messages into a short summary
async function summarize(userId: string, cardId: string, c: any, prev: string, recent: any[]) {
  try {
    const { text } = await callModel(c.p, c.m, [{ role: 'user', content:
      `Update this summary with the conversation below. Max 200 words, keep facts and decisions.\nSummary:\n${prev}\n\nConversation:\n` +
      recent.map(r => `${r.role}: ${r.content}`).join('\n') }]);
    await sql`insert into card_ai_memory (card_id, user_id, summary, summarized_upto)
              values (${cardId}, ${userId}, ${text}, now())
              on conflict (card_id) do update set summary=${text}, summarized_upto=now(), updated_date=now()`;
  } catch { /* memory is best-effort */ }
}
