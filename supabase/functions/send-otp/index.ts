import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL') || '';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// יצירת OTP בצד השרת - לא גלוי לאף אחד
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { phone, action, userOtp } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Missing phone' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // אם זה אימות OTP
    if (action === 'verify') {
      // בדוק את הקוד מהדאטאבייס
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !otpRecord) {
        return new Response(
          JSON.stringify({ success: false, error: 'No OTP found' }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // בדוק אם הקוד נכון ולא פג תוקף (5 דקות)
      const createdAt = new Date(otpRecord.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

      if (diffMinutes > 5) {
        return new Response(
          JSON.stringify({ success: false, error: 'OTP expired' }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      if (otpRecord.otp !== userOtp) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid OTP' }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // מחק את הקוד אחרי שימוש
      await supabase.from('otp_codes').delete().eq('id', otpRecord.id);

      // בדוק/צור משתמש
      let user;
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (userError && userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ phone }])
          .select()
          .single();
        if (createError) throw createError;
        user = newUser;
      } else if (userError) {
        throw userError;
      } else {
        user = existingUser;
      }

      return new Response(
        JSON.stringify({ success: true, user }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // אחרת - שלח OTP חדש
    const otpCode = generateOTP();

    // שמור את הקוד בדאטאבייס
    await supabase.from('otp_codes').insert([{ phone, otp: otpCode }]);

    // שלח ל-Make.com
    const webhookUrl = `${MAKE_WEBHOOK_URL}?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otpCode)}&secret=${encodeURIComponent(WEBHOOK_SECRET)}`;
    await fetch(webhookUrl, { method: 'GET' });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
