import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Supabase Edge Function URL - הכל מטופל בצד השרת
const SEND_OTP_URL = 'https://kauxantpdqikmepjiddu.supabase.co/functions/v1/send-otp';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXhhbnRwZHFpa21lcGppZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg5MzksImV4cCI6MjA4NTY3NDkzOX0.ILq9kMFOGY3RjRHAZfoPdRFCr8PPo6UlXrbdci9SEsY';

export default function PhoneAuth({ onAuthSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (number) => {
    let cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '972' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!phone || phone.length < 9) {
      toast.error('נא להזין מספר טלפון תקין');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);

      // שלח בקשה ליצירת OTP בצד השרת - הקוד לא עובר דרך הדפדפן
      const response = await fetch(SEND_OTP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      toast.success('קוד אימות נשלח!');
      setStep('otp');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('שגיאה בשליחת קוד האימות');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length < 6) {
      toast.error('נא להזין קוד אימות בן 6 ספרות');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);

      // אימות OTP בצד השרת - השרת בודק את הקוד ומחזיר את המשתמש
      const response = await fetch(SEND_OTP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          action: 'verify',
          userOtp: otp,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.error === 'OTP expired') {
          toast.error('קוד האימות פג תוקף, נסה שוב');
        } else if (result.error === 'Invalid OTP') {
          toast.error('קוד אימות שגוי');
        } else {
          toast.error('שגיאה באימות');
        }
        setLoading(false);
        return;
      }

      // שמור את המשתמש ואת ה-sessionToken ב-localStorage
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('sessionToken', result.sessionToken);

      toast.success('התחברת בהצלחה!');
      onAuthSuccess?.(result.user);

      // רענן את הדף
      window.location.reload();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'שגיאה באימות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">כ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">מערכת כרטיסיות</h1>
              <p className="text-sm text-slate-400">ניהול מידע חכם</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">התחברות</h2>
                  <p className="text-slate-400 mt-2">הזן את מספר הטלפון שלך</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">מספר טלפון</label>
                  <Input
                    type="tel"
                    placeholder="050-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-lg text-center tracking-wider"
                    dir="ltr"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-6"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'שלח קוד אימות'
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white">הזן קוד אימות</h2>
                  <p className="text-slate-400 mt-2">
                    שלחנו קוד בן 6 ספרות ל-{phone}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">קוד אימות</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-slate-700/50 border-slate-600 text-white text-2xl text-center tracking-[0.5em] font-mono"
                    maxLength={6}
                    dir="ltr"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-6"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'אימות והתחברות'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setStep('phone'); setOtp(''); }}
                  className="w-full text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  חזור לשינוי מספר
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
