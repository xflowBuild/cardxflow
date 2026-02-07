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
    window.location.href = '/Dashboard';
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
            onClick={() => window.location.href = '/Dashboard'}
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
              <div className="mt-6 pt-6 border-t border-slate-700" dir="ltr">
                <h3 className="text-lg font-semibold text-white mb-6 text-right" dir="rtl">API Documentation</h3>

                <div className="space-y-6 text-sm text-left">

                  {/* Section 1: Authentication */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 border border-slate-700">
                    <h4 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Authentication
                    </h4>

                    <div className="space-y-4">
                      {/* Endpoint */}
                      <div>
                        <div className="text-slate-500 text-xs mb-1">ENDPOINT</div>
                        <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2">
                          <code className="text-emerald-400 font-mono text-xs">
                            https://kauxantpdqikmepjiddu.supabase.co/functions/v1/data-api
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-slate-400 hover:text-white"
                            onClick={() => {
                              navigator.clipboard.writeText('https://kauxantpdqikmepjiddu.supabase.co/functions/v1/data-api');
                              toast.success('Endpoint copied!');
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Anon Key */}
                      <div>
                        <div className="text-slate-500 text-xs mb-1">ANON KEY</div>
                        <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2">
                          <code className="text-amber-400 font-mono text-xs truncate max-w-[280px]">
                            eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...SEsY
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-slate-400 hover:text-white"
                            onClick={() => {
                              navigator.clipboard.writeText('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXhhbnRwZHFpa21lcGppZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg5MzksImV4cCI6MjA4NTY3NDkzOX0.ILq9kMFOGY3RjRHAZfoPdRFCr8PPo6UlXrbdci9SEsY');
                              toast.success('Anon Key copied!');
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Session Token */}
                      <div>
                        <div className="text-slate-500 text-xs mb-1">YOUR SESSION TOKEN</div>
                        <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2">
                          <code className="text-violet-400 font-mono text-xs truncate max-w-[280px]">
                            {sessionToken ? sessionToken.substring(0, 40) + '...' : 'Not logged in'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-slate-400 hover:text-white"
                            onClick={() => {
                              navigator.clipboard.writeText(sessionToken || '');
                              toast.success('Session Token copied!');
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-slate-500 text-xs mt-1">Expires: 24 hours from login</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Available Actions */}
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
                    <h4 className="text-blue-400 font-semibold mb-4">Available Actions</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-slate-400 font-medium">Action</th>
                            <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                            <th className="text-left py-2 text-slate-400 font-medium">Required Params</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-emerald-400">list</code></td>
                            <td className="py-2">Get all items</td>
                            <td className="py-2 text-slate-500">table, sessionToken</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-emerald-400">get</code></td>
                            <td className="py-2">Get single item</td>
                            <td className="py-2 text-slate-500">table, sessionToken, id</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-emerald-400">create</code></td>
                            <td className="py-2">Create new item</td>
                            <td className="py-2 text-slate-500">table, sessionToken, data</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-emerald-400">update</code></td>
                            <td className="py-2">Update existing item</td>
                            <td className="py-2 text-slate-500">table, sessionToken, id, data</td>
                          </tr>
                          <tr>
                            <td className="py-2"><code className="text-emerald-400">delete</code></td>
                            <td className="py-2">Delete item</td>
                            <td className="py-2 text-slate-500">table, sessionToken, id</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 3: Request Format */}
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
                    <h4 className="text-purple-400 font-semibold mb-4">Request Format</h4>
                    <div className="space-y-3">
                      <div className="text-slate-400 text-xs">All requests use <code className="text-white bg-slate-700 px-1 rounded">POST</code> method</div>

                      <div>
                        <div className="text-slate-500 text-xs mb-2">HEADERS</div>
                        <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`Content-Type: application/json
Authorization: Bearer <ANON_KEY>`}
                        </pre>
                      </div>

                      <div>
                        <div className="text-slate-500 text-xs mb-2">BODY STRUCTURE</div>
                        <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono overflow-x-auto text-cyan-400">
{`{
  "action": "list | get | create | update | delete",
  "table": "cards | folders",
  "sessionToken": "<YOUR_SESSION_TOKEN>",
  "id": "<uuid>",           // for get, update, delete
  "data": { ... },          // for create, update
  "sortBy": "-created_date" // optional, for list
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Examples */}
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
                    <h4 className="text-green-400 font-semibold mb-4">Examples</h4>
                    <p className="text-slate-400 text-xs mb-4">All requests are <code className="bg-slate-700 px-1 rounded text-white">POST</code> to the endpoint above</p>

                    <div className="space-y-4">
                      {/* List Cards Example */}
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">action: list</span>
                            <span className="text-slate-300 text-xs">Get all cards</span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "action": "list",
  "table": "cards",
  "sessionToken": "${sessionToken ? sessionToken.substring(0, 20) + '...' : '<token>'}",
  "sortBy": "-created_date"
}`}
                          </pre>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify({
                                  action: "list",
                                  table: "cards",
                                  sessionToken: sessionToken,
                                  sortBy: "-created_date"
                                }, null, 2));
                                toast.success('Body copied!');
                              }}>
                              <Copy className="w-3 h-3 mr-1" /> Body
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600"
                              onClick={() => {
                                navigator.clipboard.writeText(`curl -X POST "https://kauxantpdqikmepjiddu.supabase.co/functions/v1/data-api" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXhhbnRwZHFpa21lcGppZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg5MzksImV4cCI6MjA4NTY3NDkzOX0.ILq9kMFOGY3RjRHAZfoPdRFCr8PPo6UlXrbdci9SEsY" \\
  -d '${JSON.stringify({action:"list",table:"cards",sessionToken:sessionToken,sortBy:"-created_date"})}'`);
                                toast.success('cURL copied!');
                              }}>
                              <Copy className="w-3 h-3 mr-1" /> cURL
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600"
                              onClick={() => {
                                navigator.clipboard.writeText(`const response = await fetch("https://kauxantpdqikmepjiddu.supabase.co/functions/v1/data-api", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXhhbnRwZHFpa21lcGppZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg5MzksImV4cCI6MjA4NTY3NDkzOX0.ILq9kMFOGY3RjRHAZfoPdRFCr8PPo6UlXrbdci9SEsY"
  },
  body: JSON.stringify({
    action: "list",
    table: "cards",
    sessionToken: "${sessionToken}",
    sortBy: "-created_date"
  })
});
const data = await response.json();`);
                                toast.success('JavaScript copied!');
                              }}>
                              <Copy className="w-3 h-3 mr-1" /> JavaScript
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Create Card Example */}
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">action: create</span>
                            <span className="text-slate-300 text-xs">Create new card</span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "action": "create",
  "table": "cards",
  "sessionToken": "<token>",
  "data": {
    "title": "My New Card",
    "color": "#8B5CF6",
    "tags": ["work", "important"],
    "is_favorite": false
  }
}`}
                          </pre>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify({
                                  action: "create",
                                  table: "cards",
                                  sessionToken: sessionToken,
                                  data: {
                                    title: "My New Card",
                                    color: "#8B5CF6",
                                    tags: ["work", "important"],
                                    is_favorite: false
                                  }
                                }, null, 2));
                                toast.success('Body copied!');
                              }}>
                              <Copy className="w-3 h-3 mr-1" /> Body
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600"
                              onClick={() => {
                                navigator.clipboard.writeText(`curl -X POST "https://kauxantpdqikmepjiddu.supabase.co/functions/v1/data-api" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXhhbnRwZHFpa21lcGppZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg5MzksImV4cCI6MjA4NTY3NDkzOX0.ILq9kMFOGY3RjRHAZfoPdRFCr8PPo6UlXrbdci9SEsY" \\
  -d '${JSON.stringify({action:"create",table:"cards",sessionToken:sessionToken,data:{title:"My New Card",color:"#8B5CF6",tags:["work","important"],is_favorite:false}})}'`);
                                toast.success('cURL copied!');
                              }}>
                              <Copy className="w-3 h-3 mr-1" /> cURL
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Update Card Example */}
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">action: update</span>
                            <span className="text-slate-300 text-xs">Update existing card</span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "action": "update",
  "table": "cards",
  "sessionToken": "<token>",
  "id": "<card_uuid>",
  "data": {
    "title": "Updated Title"
  }
}`}
                          </pre>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify({
                                  action: "update",
                                  table: "cards",
                                  sessionToken: sessionToken,
                                  id: "<card_uuid>",
                                  data: { title: "Updated Title" }
                                }, null, 2));
                                toast.success('Body copied!');
                              }}>
                              <Copy className="w-3 h-3 mr-1" /> Body
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Delete Card Example */}
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">action: delete</span>
                            <span className="text-slate-300 text-xs">Delete card</span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <pre className="bg-black/40 rounded-lg p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "action": "delete",
  "table": "cards",
  "sessionToken": "<token>",
  "id": "<card_uuid>"
}`}
                          </pre>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify({
                                  action: "delete",
                                  table: "cards",
                                  sessionToken: sessionToken,
                                  id: "<card_uuid>"
                                }, null, 2));
                                toast.success('Body copied!');
                              }}>
                              <Copy className="w-3 h-3 mr-1" /> Body
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Card Schema */}
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
                    <h4 className="text-pink-400 font-semibold mb-4">Card Schema</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-slate-400 font-medium">Field</th>
                            <th className="text-left py-2 text-slate-400 font-medium">Type</th>
                            <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-amber-400">id</code></td>
                            <td className="py-2 text-slate-500">uuid</td>
                            <td className="py-2">Unique identifier</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-amber-400">title</code></td>
                            <td className="py-2 text-slate-500">string</td>
                            <td className="py-2">Card title</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-amber-400">color</code></td>
                            <td className="py-2 text-slate-500">hex string</td>
                            <td className="py-2">Card color (#RRGGBB)</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-amber-400">folder_id</code></td>
                            <td className="py-2 text-slate-500">uuid | null</td>
                            <td className="py-2">Parent folder</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-amber-400">tags</code></td>
                            <td className="py-2 text-slate-500">string[]</td>
                            <td className="py-2">Tags array</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-amber-400">content_blocks</code></td>
                            <td className="py-2 text-slate-500">object[]</td>
                            <td className="py-2">Content blocks</td>
                          </tr>
                          <tr className="border-b border-slate-800">
                            <td className="py-2"><code className="text-amber-400">is_favorite</code></td>
                            <td className="py-2 text-slate-500">boolean</td>
                            <td className="py-2">Favorite status</td>
                          </tr>
                          <tr>
                            <td className="py-2"><code className="text-amber-400">created_date</code></td>
                            <td className="py-2 text-slate-500">timestamp</td>
                            <td className="py-2">Creation date</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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
