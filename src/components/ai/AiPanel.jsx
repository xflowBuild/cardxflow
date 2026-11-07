// Hidden side panel: per-card AI chat with any OpenAI-compatible provider (keys stored encrypted server-side).
import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Settings, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiClient } from '@/api/aiClient';

const emptyProvider = { name: '', base_url: 'https://api.openai.com/v1', api_key: '', modelsText: 'gpt-4o-mini', is_default: false };

function ProviderSettings({ providers, onChanged }) {
  const [form, setForm] = useState(emptyProvider);
  const [err, setErr] = useState('');
  const save = async () => {
    setErr('');
    try {
      const models = form.modelsText.split(',').map(s => s.trim()).filter(Boolean).map((id, i) => ({ id, priority: i }));
      await aiClient.saveProvider({ id: form.id, name: form.name || form.base_url, base_url: form.base_url, api_key: form.api_key || undefined, models, is_default: form.is_default });
      setForm(emptyProvider); onChanged();
    } catch (e) { setErr(e.message); }
  };
  const edit = (p) => setForm({ id: p.id, name: p.name, base_url: p.base_url, api_key: '', modelsText: (p.models || []).map(m => m.id).join(', '), is_default: p.is_default });
  return (
    <div className="space-y-3 text-sm">
      {providers.map(p => (
        <div key={p.id} className="flex items-center justify-between bg-slate-800 rounded p-2">
          <button className="text-right flex-1" onClick={() => edit(p)}>
            <div className="text-white">{p.name}{p.is_default ? ' ⭐' : ''}</div>
            <div className="text-slate-400 text-xs">{(p.models || []).map(m => m.id).join(', ')}</div>
          </button>
          <Button size="icon" variant="ghost" onClick={async () => { await aiClient.deleteProvider(p.id); onChanged(); }}><Trash2 className="w-4 h-4 text-red-400" /></Button>
        </div>
      ))}
      <div className="space-y-2 border-t border-slate-700 pt-3">
        <div className="text-slate-300">{form.id ? 'עריכת ספק' : 'ספק חדש'}</div>
        <Input placeholder="שם (למשל OpenAI)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-900 border-slate-600" />
        <Input dir="ltr" placeholder="Base URL" value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })} className="bg-slate-900 border-slate-600" />
        <Input dir="ltr" type="password" placeholder={form.id ? 'API key (ריק = ללא שינוי)' : 'API key'} value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} className="bg-slate-900 border-slate-600" />
        <Input dir="ltr" placeholder="models, by priority" value={form.modelsText} onChange={e => setForm({ ...form, modelsText: e.target.value })} className="bg-slate-900 border-slate-600" />
        <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} /> ברירת מחדל</label>
        {err && <p className="text-red-400">{err}</p>}
        <Button size="sm" onClick={save}><Plus className="w-4 h-4 ml-1" />שמור</Button>
      </div>
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
    const list = await aiClient.listProviders();
    setProviders(list);
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
