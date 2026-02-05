import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL') || '';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'fallback-secret-change-me';

// יצירת OTP בצד השרת - לא גלוי לאף אחד
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// פונקציה ליצירת HMAC-SHA256 signature
const createSignature = async (data: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Base64 URL safe encoding
const base64UrlEncode = (str: string): string => {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// יצירת JWT חתום עם HMAC-SHA256
const generateSignedJWT = async (userId: string): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId,
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 שעות
    iat: Date.now(),
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const signature = await createSignature(dataToSign, JWT_SECRET);

  return `${dataToSign}.${signature}`;
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

    // אם זה בקשת איפוס PIN - שולח OTP
    if (action === 'requestPinReset') {
      // מוודא שיש משתמש עם הטלפון הזה
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single();

      if (userError || !existingUser) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // יצירת ושליחת OTP
      const otpCode = generateOTP();

      const { error: insertError } = await supabase.from('otp_codes').insert([{ phone, otp: otpCode }]);
      if (insertError) throw insertError;

      // שלח ל-Make.com
      const webhookUrl = `${MAKE_WEBHOOK_URL}?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otpCode)}&secret=${encodeURIComponent(WEBHOOK_SECRET)}`;
      await fetch(webhookUrl, { method: 'GET' });

      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent for PIN reset' }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // אם זה אימות OTP לאיפוס PIN
    if (action === 'verifyPinReset') {
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

      // בדוק תפוגה
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

      return new Response(
        JSON.stringify({ success: true, message: 'OTP verified, you can now set a new PIN' }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // אם זה אימות OTP להתחברות
    if (action === 'verify') {
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

      // יצירת JWT חתום מאובטח
      const sessionToken = await generateSignedJWT(user.id);

      return new Response(
        JSON.stringify({ success: true, user, sessionToken }),
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
    const { error: insertError } = await supabase.from('otp_codes').insert([{ phone, otp: otpCode }]);
    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      throw insertError;
    }

    // שלח ל-Make.com
    console.log('MAKE_WEBHOOK_URL:', MAKE_WEBHOOK_URL ? 'SET' : 'NOT SET');
    console.log('WEBHOOK_SECRET:', WEBHOOK_SECRET ? 'SET' : 'NOT SET');

    const webhookUrl = `${MAKE_WEBHOOK_URL}?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otpCode)}&secret=${encodeURIComponent(WEBHOOK_SECRET)}`;
    console.log('Calling webhook...');

    const webhookResponse = await fetch(webhookUrl, { method: 'GET' });
    const webhookStatus = webhookResponse.status;
    console.log('Webhook response status:', webhookStatus);

    return new Response(
      JSON.stringify({ success: true, webhookStatus }),
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
