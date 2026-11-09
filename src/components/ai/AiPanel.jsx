// Hidden side panel: per-card AI chat with any OpenAI-compatible provider (keys stored encrypted server-side).
import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Settings, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiClient } from '@/api/aiClient';

const PRESETS = [
  { key: 'openrouter', name: 'OpenRouter', base_url: 'https://openrouter.ai/api/v1', keyUrl: 'https://openrouter.ai/keys', models: ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat-v3-0324:free', 'google/gemma-3-27b-it:free'] },
  { key: 'gemini', name: 'Gemini', base_url: 'https://generativelanguage.googleapis.com/v1beta/openai/', keyUrl: 'https://aistudio.google.com/apikey', models: ['gemini-3.8-flash', 'gemini-3.5-flash-lite'] },
  { key: 'github', name: 'GitHub Models', base_url: 'https://models.github.ai/inference', keyUrl: 'https://github.com/settings/tokens', models: ['openai/gpt-4o-mini', 'meta/Llama-3.3-70B-Instruct'] },
  { key: 'openai', name: 'OpenAI', base_url: 'https://api.openai.com/v1', keyUrl: 'https://platform.openai.com/api-keys', models: ['gpt-4o-mini'] },
];

function ProviderSettings({ providers, onChanged }) {
  const [keys, setKeys] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({});
  const [adv, setAdv] = useState(false);
  const [form, setForm] = useState({ name: '', base_url: '', api_key: '', modelsText: '' });
  const findP = (pr) => providers.find(p => p.base_url === pr.base_url);
  const save = async (pr) => {
    const k = (keys[pr.key] || '').trim();
    if (!k) return;
    setBusy(pr.key); setMsg(m => ({ ...m, [pr.key]: '' }));
    try {
      const ex = findP(pr);
      await aiClient.saveProvider({ id: ex?.id, name: pr.name, base_url: pr.base_url, api_key: k,
        models: pr.models.map((id, i) => ({ id, priority: i })), is_default: ex ? ex.is_default : providers.length === 0 });
      setKeys(s => ({ ...s, [pr.key]: '' })); setMsg(m => ({ ...m, [pr.key]: '✅ נשמר' })); onChanged();
    } catch (e) { setMsg(m => ({ ...m, [pr.key]: '❌ ' + e.message })); } finally { setBusy(''); }
  };
  const saveCustom = async () => {
    try {
      const models = form.modelsText.split(',').map(s => s.trim()).filter(Boolean).map((id, i) => ({ id, priority: i }));
      await aiClient.saveProvider({ name: form.name || form.base_url, base_url: form.base_url, api_key: form.api_key, models, is_default: providers.length === 0 });
      setForm({ name: '', base_url: '', api_key: '', modelsText: '' }); onChanged();
    } catch (e) { setMsg(m => ({ ...m, custom: '❌ ' + e.message })); }
  };
  return (
    <div className="space-y-3 text-sm">
      <p className="text-slate-400">מדביקים מפתח ולוחצים שמור. זהו.</p>
      {PRESETS.map(pr => {
        const ex = findP(pr);
        return (
          <div key={pr.key} className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{pr.name} {ex && <span className="text-green-400 text-xs">● מחובר</span>}</span>
              <div className="flex items-center gap-2">
                <a href={pr.keyUrl} target="_blank" rel="noreferrer" className="text-violet-400 text-xs underline">השג מפתח</a>
                {ex && <Button size="icon" variant="ghost" onClick={async () => { await aiClient.deleteProvider(ex.id); onChanged(); }}><Trash2 className="w-4 h-4 text-red-400" /></Button>}
              </div>
            </div>
            <div className="flex gap-2">
              <Input dir="ltr" type="password" placeholder={ex ? 'החלפת מפתח' : 'הדבק מפתח'} value={keys[pr.key] || ''}
                onChange={e => setKeys(s => ({ ...s, [pr.key]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && save(pr)} className="bg-slate-950 border-slate-600" />
              <Button size="sm" disabled={busy === pr.key || !(keys[pr.key] || '').trim()} onClick={() => save(pr)}>{busy === pr.key ? '...' : 'שמור'}</Button>
            </div>
            {msg[pr.key] && <p className="text-xs text-slate-300">{msg[pr.key]}</p>}
          </div>
        );
      })}
      <button className="text-slate-500 text-xs underline" onClick={() => setAdv(a => !a)}>{adv ? 'הסתר' : 'ספק אחר (מתקדם)'}</button>
      {adv && (
        <div className="space-y-2">
          {providers.filter(p => !PRESETS.some(pr => pr.base_url === p.base_url)).map(p => (
            <div key={p.id} className="flex items-center justify-between bg-slate-800 rounded p-2">
              <span className="text-white">{p.name}</span>
              <Button size="icon" variant="ghost" onClick={async () => { await aiClient.deleteProvider(p.id); onChanged(); }}><Trash2 className="w-4 h-4 text-red-400" /></Button>
            </div>
          ))}
          <Input placeholder="שם" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-900 border-slate-600" />
          <Input dir="ltr" placeholder="Base URL" value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })} className="bg-slate-900 border-slate-600" />
          <Input dir="ltr" type="password" placeholder="API key" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} className="bg-slate-900 border-slate-600" />
          <Input dir="ltr" placeholder="models, comma separated" value={form.modelsText} onChange={e => setForm({ ...form, modelsText: e.target.value })} className="bg-slate-900 border-slate-600" />
          {msg.custom && <p className="text-red-400 text-xs">{msg.custom}</p>}
          <Button size="sm" onClick={saveCustom}><Plus className="w-4 h-4 ml-1" />שמור</Button>
        </div>
      )}
    </div>
  );
}

export default function AiPanel({ cardId, open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [providers, setProviders] = useState([]);
  const [choice, setChoice] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const endRef = useRef(null);

  const loadProviders = async () => {
    let list = await aiClient.listProviders();
    // Auto-sync preset providers to the current model list (keeps the saved key)
    const stale = list.filter(p => { const pr = PRESETS.find(x => x.base_url === p.base_url);
      return pr && JSON.stringify((p.models || []).map(m => m.id)) !== JSON.stringify(pr.models); });
    if (stale.length) {
      await Promise.all(stale.map(p => { const pr = PRESETS.find(x => x.base_url === p.base_url);
        return aiClient.saveProvider({ id: p.id, name: p.name, base_url: p.base_url, is_default: p.is_default,
          models: pr.models.map((id, i) => ({ id, priority: i })) }); }));
      list = await aiClient.listProviders();
    }
    setProviders(list);
    setChoice(c => c && !list.some(p => (p.models || []).some(m => `${p.id}|${m.id}` === c)) ? '' : c);
    if (!list.length) setShowSettings(true);
  };

  useEffect(() => {
    if (!open || !cardId) return;
    setErr('');
    Promise.all([aiClient.history(cardId).then(setMessages), loadProviders()]).catch(e => setErr(e.message));
  }, [open, cardId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput(''); setErr(''); setBusy(true);
    setMessages(m => [...m, { role: 'user', content: text }]);
    try {
      const [provider_id, model] = choice ? choice.split('|') : [undefined, undefined];
      const r = await aiClient.send(cardId, text, provider_id, model);
      setMessages(m => [...m, { role: 'assistant', content: r.reply, model: r.model }]);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div dir="rtl" className="absolute inset-y-0 left-0 z-50 w-full sm:w-[380px] bg-slate-950 border-r border-slate-700 flex flex-col shadow-2xl">
      <div className="p-3 border-b border-slate-700 flex items-center gap-2">
        <span className="text-white font-semibold flex-1">✨ צ'אט AI על הכרטיס</span>
        <Button size="icon" variant="ghost" onClick={() => setShowSettings(s => !s)}><Settings className="w-4 h-4 text-slate-300" /></Button>
        <Button size="icon" variant="ghost" title="נקה שיחה" onClick={async () => { await aiClient.clear(cardId); setMessages([]); }}><Trash2 className="w-4 h-4 text-slate-300" /></Button>
        <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4 text-slate-300" /></Button>
      </div>
      {showSettings ? (
        <div className="flex-1 overflow-y-auto p-3"><ProviderSettings providers={providers} onChanged={loadProviders} /></div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {!messages.length && <p className="text-slate-500 text-sm text-center mt-8">שאל כל שאלה על תוכן הכרטיס</p>}
            {messages.map((m, i) => (
              <div key={m.id || i} className={m.role === 'user' ? 'flex justify-start' : 'flex justify-end'}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
                  {m.content}
                  {m.model && <div className="text-[10px] text-slate-400 mt-1" dir="ltr">{m.model}</div>}
                </div>
              </div>
            ))}
            {busy && <div className="text-slate-400 text-sm">חושב...</div>}
            <div ref={endRef} />
          </div>
          {err && <p className="text-red-400 text-xs px-3 pb-1">{err}</p>}
          <div className="p-3 border-t border-slate-700 space-y-2">
            <select value={choice} onChange={e => setChoice(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 p-1">
              <option value="">מודל אוטומטי (ברירת מחדל + גיבוי)</option>
              {providers.flatMap(p => (p.models || []).map(m => (
                <option key={`${p.id}|${m.id}`} value={`${p.id}|${m.id}`}>{p.name} / {m.id}</option>
              )))}
            </select>
            <div className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="כתוב הודעה..." className="bg-slate-900 border-slate-600" />
              <Button onClick={send} disabled={busy || !input.trim()}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
