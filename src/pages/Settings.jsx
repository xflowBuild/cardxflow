import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  User,
  Key,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Check,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster, toast } from "sonner";
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';

export default function Settings() {
  const { user: authUser, logout } = useAuth();
  const queryClient = useQueryClient();

  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // API Key state
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // PIN state
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // PIN Reset state
  const [resetMode, setResetMode] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Fetch profile
  const { data: profile, isLoading: profileFetching } = useQuery({
    queryKey: ['profile'],
    queryFn: () => base44.auth.getProfile(),
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setHasPin(profile.hasPin || false);
    }
  }, [profile]);

  const sessionToken = base44.auth.getSessionToken();

  // Save profile
  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      await base44.auth.updateProfile({ full_name: fullName, email });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('הפרופיל עודכן בהצלחה');
    } catch (error) {
      toast.error('שגיאה בעדכון הפרופיל');
    }
    setProfileLoading(false);
  };

  // Copy token
  const handleCopyToken = () => {
    navigator.clipboard.writeText(sessionToken);
    setCopied(true);
    toast.success('הועתק ללוח');
    setTimeout(() => setCopied(false), 2000);
  };

  // Set PIN
  const handleSetPin = async () => {
    if (pin.length < 4 || pin.length > 6) {
      toast.error('ה-PIN חייב להכיל 4-6 ספרות');
      return;
    }
    if (!/^\d+$/.test(pin)) {
      toast.error('ה-PIN חייב להכיל ספרות בלבד');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('קודי ה-PIN לא תואמים');
      return;
    }

    setPinLoading(true);
    try {
      await base44.auth.setPin(pin);
      setHasPin(true);
      setPin('');
      setConfirmPin('');
      toast.success('ה-PIN הוגדר בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      toast.error('שגיאה בהגדרת ה-PIN');
    }
    setPinLoading(false);
  };

  // Request PIN reset (send OTP)
  const handleRequestPinReset = async () => {
    setResetLoading(true);
    try {
      await base44.auth.requestPinReset(profile.phone);
      setOtpSent(true);
      toast.success('קוד אימות נשלח ב-SMS');
    } catch (error) {
      toast.error('שגיאה בשליחת קוד האימות');
    }
    setResetLoading(false);
  };

  // Verify OTP for PIN reset
  const handleVerifyResetOtp = async () => {
    if (resetOtp.length !== 6) {
      toast.error('הקוד חייב להכיל 6 ספרות');
      return;
    }

    setResetLoading(true);
    try {
      const result = await base44.auth.verifyPinResetOtp(profile.phone, resetOtp);
      if (result.success) {
        setOtpVerified(true);
        // Clear existing PIN
        await base44.auth.clearPin();
        setHasPin(false);
        toast.success('האימות הצליח! כעת תוכל להגדיר PIN חדש');
      } else {
        toast.error('הקוד שגוי');
      }
    } catch (error) {
      toast.error('שגיאה באימות הקוד');
    }
    setResetLoading(false);
  };

  // Cancel reset mode
  const handleCancelReset = () => {
    setResetMode(false);
    setOtpSent(false);
    setOtpVerified(false);
    setResetOtp('');
    setPin('');
    setConfirmPin('');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    window.location.href = createPageUrl('Dashboard');
  };

  if (profileFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4" dir="rtl">
      <Toaster position="top-center" richColors />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">הגדרות</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">פרטי פרופיל</h2>
                <p className="text-sm text-slate-400">עדכן את פרטי החשבון שלך</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Phone (read-only) */}
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  מספר טלפון
                </Label>
                <Input
                  value={profile?.phone || ''}
                  disabled
                  className="bg-slate-700/50 border-slate-600 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">מספר הטלפון לא ניתן לשינוי</p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label className="text-slate-300">שם מלא</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="הזן את שמך המלא"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  אימייל
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="bg-slate-700/50 border-slate-600 text-white"
                  dir="ltr"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={profileLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {profileLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : null}
                שמור שינויים
              </Button>
            </div>
          </motion.div>

          {/* API Keys Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">מפתחות API</h2>
                <p className="text-sm text-slate-400">מפתח הגישה לשימוש ב-API חיצוני</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Session Token</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={sessionToken || ''}
                      readOnly
                      className="bg-slate-700/50 border-slate-600 text-white font-mono text-sm pl-10"
                      dir="ltr"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyToken}
                    className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">תוקף: 24 שעות מרגע ההתחברות</p>
              </div>

              {/* API Documentation */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-sm font-medium text-white mb-4">תיעוד API</h3>

                <div className="space-y-4 text-sm">
                  {/* Base URL */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 mb-2">Base URL</div>
                    <code className="text-amber-400 font-mono text-xs break-all">
                      https://kauxantpdqikmepjiddu.supabase.co/functions/v1/data-api
                    </code>
                  </div>

                  {/* Headers */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 mb-2">Headers נדרשים</div>
                    <pre className="text-emerald-400 font-mono text-xs overflow-x-auto">
{`Content-Type: application/json
Authorization: Bearer <ANON_KEY>`}
                    </pre>
                  </div>

                  {/* Request Body */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 mb-2">Body (JSON)</div>
                    <pre className="text-cyan-400 font-mono text-xs overflow-x-auto">
{`{
  "action": "list" | "get" | "create" | "update" | "delete",
  "table": "cards" | "folders" | "tags",
  "sessionToken": "<YOUR_SESSION_TOKEN>",
  "id": "uuid",        // for get, update, delete
  "data": { ... },     // for create, update
  "sortBy": "-created_date"  // for list (optional)
}`}
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <div className="text-slate-300 font-medium">פעולות זמינות:</div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-mono">list</span>
                        <span className="text-slate-300">קבלת כל הפריטים</span>
                      </div>
                      <pre className="text-slate-500 font-mono text-xs">
{`{ "action": "list", "table": "cards", "sessionToken": "...", "sortBy": "-created_date" }`}
                      </pre>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-mono">create</span>
                        <span className="text-slate-300">יצירת פריט חדש</span>
                      </div>
                      <pre className="text-slate-500 font-mono text-xs">
{`{ "action": "create", "table": "cards", "sessionToken": "...", "data": { "title": "כרטיסייה חדשה" } }`}
                      </pre>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-mono">update</span>
                        <span className="text-slate-300">עדכון פריט קיים</span>
                      </div>
                      <pre className="text-slate-500 font-mono text-xs">
{`{ "action": "update", "table": "cards", "sessionToken": "...", "id": "uuid", "data": { "title": "שם חדש" } }`}
                      </pre>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-mono">delete</span>
                        <span className="text-slate-300">מחיקת פריט</span>
                      </div>
                      <pre className="text-slate-500 font-mono text-xs">
{`{ "action": "delete", "table": "cards", "sessionToken": "...", "id": "uuid" }`}
                      </pre>
                    </div>
                  </div>

                  {/* Example with cURL */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 mb-2">דוגמה עם cURL</div>
                    <pre className="text-violet-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`curl -X POST \\
  https://kauxantpdqikmepjiddu.supabase.co/functions/v1/data-api \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -d '{
    "action": "list",
    "table": "cards",
    "sessionToken": "${sessionToken?.substring(0, 20)}..."
  }'`}
                    </pre>
                  </div>

                  {/* Card Schema */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 mb-2">מבנה כרטיסייה (Card)</div>
                    <pre className="text-pink-400 font-mono text-xs overflow-x-auto">
{`{
  "id": "uuid",
  "title": "string",
  "color": "#hex",
  "folder_id": "uuid | null",
  "tags": ["string"],
  "content_blocks": [
    { "type": "text", "content": "..." },
    { "type": "api", "templateId": "uuid", "params": {} }
  ],
  "is_smart_card": boolean,
  "is_favorite": boolean,
  "created_date": "timestamp",
  "updated_date": "timestamp"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* PIN Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">סיסמה רב-פעמית (PIN)</h2>
                <p className="text-sm text-slate-400">הגדר קוד PIN לכניסה מהירה</p>
              </div>
            </div>

            {hasPin && !resetMode ? (
              // PIN is set
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300">סיסמה רב-פעמית מוגדרת</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setResetMode(true)}
                  className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  אפס סיסמה
                </Button>
              </div>
            ) : resetMode && !otpVerified ? (
              // Reset mode - OTP verification
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300">איפוס סיסמה דורש אימות SMS</span>
                </div>

                {!otpSent ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-400">
                      קוד אימות יישלח למספר {profile?.phone}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRequestPinReset}
                        disabled={resetLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {resetLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                        שלח קוד אימות
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleCancelReset}
                        className="text-slate-400 hover:text-white"
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label className="text-slate-300">הזן את הקוד שקיבלת ב-SMS</Label>
                    <Input
                      type="text"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="______"
                      maxLength={6}
                      className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-widest font-mono"
                      dir="ltr"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleVerifyResetOtp}
                        disabled={resetLoading || resetOtp.length !== 6}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {resetLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                        אמת קוד
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleCancelReset}
                        className="text-slate-400 hover:text-white"
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Set new PIN (either first time or after reset)
              <div className="space-y-4">
                {otpVerified && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300">אימות הצליח! הגדר PIN חדש</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-300">PIN חדש (4-6 ספרות)</Label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    className="bg-slate-700/50 border-slate-600 text-white text-center text-xl tracking-widest"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">אימות PIN</Label>
                  <Input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    className="bg-slate-700/50 border-slate-600 text-white text-center text-xl tracking-widest"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSetPin}
                    disabled={pinLoading || pin.length < 4 || pin !== confirmPin}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {pinLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                    הגדר PIN
                  </Button>
                  {resetMode && (
                    <Button
                      variant="ghost"
                      onClick={handleCancelReset}
                      className="text-slate-400 hover:text-white"
                    >
                      ביטול
                    </Button>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Logout Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">התנתק</h2>
                  <p className="text-sm text-slate-400">יציאה מהחשבון</p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                התנתק
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
