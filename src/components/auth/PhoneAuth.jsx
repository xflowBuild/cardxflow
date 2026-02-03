import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/api/supabaseClient';
import { toast } from "sonner";

// Make.com webhook URL - שנה לכתובת שלך
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/wa6uim31f98j5igxiv3u7ff66hdjadhr';

export default function PhoneAuth({ onAuthSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
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

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
      const otpCode = generateOTP();

      // שלח ל-Make.com webhook
      const webhookUrl = `${MAKE_WEBHOOK_URL}?phone=${encodeURIComponent(formattedPhone)}&otp=${encodeURIComponent(otpCode)}`;

      // Script injection - עובד תמיד
      const script = document.createElement('script');
      script.src = webhookUrl;
      document.body.appendChild(script);
      setTimeout(() => script.remove(), 1000);

      // שמור את הקוד לאימות מקומי
      setGeneratedOtp(otpCode);

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
      // בדוק אם הקוד נכון
      if (otp !== generatedOtp) {
        toast.error('קוד אימות שגוי');
        setLoading(false);
        return;
      }

      const formattedPhone = formatPhoneNumber(phone);

      // בדוק אם המשתמש קיים בטבלה שלנו
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', formattedPhone)
        .single();

      let user;

      if (fetchError && fetchError.code === 'PGRST116') {
        // משתמש לא קיים - צור אותו
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ phone: formattedPhone }])
          .select()
          .single();

        if (createError) throw createError;
        user = newUser;
      } else if (fetchError) {
        throw fetchError;
      } else {
        user = existingUser;
      }

      // שמור את המשתמש ב-localStorage
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('התחברת בהצלחה!');
      onAuthSuccess?.(user);

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
