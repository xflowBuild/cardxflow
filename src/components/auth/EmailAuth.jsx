import React, { useState } from 'react';
import { neonAuth } from '@/api/neonAuth';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EmailAuth() {
  const { checkSession, authError, logout } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      if (mode === 'signup') await neonAuth.signUp(email, password, name);
      else await neonAuth.signIn(email, password);
      await checkSession();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  const shell = (children) => (
    <div dir="rtl" className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-4 text-white">{children}</div>
    </div>
  );

  if (authError === 'PENDING_APPROVAL') return shell(<>
    <h1 className="text-xl font-bold">ממתין לאישור</h1>
    <p className="text-slate-300 text-sm">החשבון נוצר. הגישה תיפתח אחרי שמנהל המערכת יאשר אותו.</p>
    <Button className="w-full" onClick={checkSession}>בדוק שוב</Button>
    <Button variant="ghost" className="w-full text-slate-400" onClick={logout}>התנתק</Button>
  </>);

  const shownErr = err || (authError && !['PENDING_APPROVAL', 'Not authenticated'].includes(authError) ? authError : '');
  return shell(<form onSubmit={submit} className="space-y-3">
    <h1 className="text-xl font-bold">{mode === 'signup' ? 'הרשמה' : 'התחברות'}</h1>
    {mode === 'signup' && <Input placeholder="שם" value={name} onChange={e => setName(e.target.value)} className="bg-slate-900 border-slate-600" />}
    <Input type="email" required placeholder="אימייל" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-900 border-slate-600" dir="ltr" />
    <Input type="password" required minLength={8} placeholder="סיסמה" value={password} onChange={e => setPassword(e.target.value)} className="bg-slate-900 border-slate-600" dir="ltr" />
    {shownErr && <p className="text-red-400 text-sm">{shownErr}</p>}
    <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
      {busy ? '...' : mode === 'signup' ? 'הרשם' : 'התחבר'}
    </Button>
    <button type="button" className="text-sm text-violet-300 w-full" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
      {mode === 'signup' ? 'יש לי חשבון, להתחברות' : 'אין לי חשבון, להרשמה'}
    </button>
  </form>);
}
