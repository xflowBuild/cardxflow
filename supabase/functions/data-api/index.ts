import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'fallback-secret-change-me';

// רשימת טבלאות מורשות
const ALLOWED_TABLES = ['cards', 'folders', 'tags'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
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

// Base64 URL safe decoding
const base64UrlDecode = (str: string): string => {
  // Add padding if needed
  let padded = str.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) {
    padded += '=';
  }
  return atob(padded);
};

// אימות JWT חתום עם HMAC-SHA256
const verifySignedJWT = async (token: string): Promise<{ userId: string } | null> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid JWT format');
      return null;
    }

    const [headerB64, payloadB64, receivedSignature] = parts;

    // אמת את החתימה
    const dataToVerify = `${headerB64}.${payloadB64}`;
    const expectedSignature = await createSignature(dataToVerify, JWT_SECRET);

    if (receivedSignature !== expectedSignature) {
      console.log('Invalid JWT signature');
      return null;
    }

    // פענח את ה-payload
    const payload = JSON.parse(base64UrlDecode(payloadB64));

    // בדוק תפוגה
    if (payload.exp < Date.now()) {
      console.log('JWT expired');
      return null;
    }

    return { userId: payload.userId };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, table, data, id, sortBy, sessionToken } = await req.json();

    // אימות session token
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Missing session token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = await verifySignedJWT(sessionToken);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.userId;

    // וידוא שהטבלה מורשית
    if (table && !ALLOWED_TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ error: 'Table not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let result;

    switch (action) {
      case 'list': {
        // קריאת נתונים - רק של המשתמש הנוכחי
        let query = supabase.from(table).select('*').eq('user_id', userId);

        if (sortBy) {
          const desc = sortBy.startsWith('-');
          const field = desc ? sortBy.slice(1) : sortBy;
          query = query.order(field, { ascending: !desc });
        }

        const { data: items, error } = await query;
        if (error) throw error;
        result = items || [];
        break;
      }

      case 'get': {
        // קריאת פריט בודד - רק אם שייך למשתמש
        const { data: item, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .eq('user_id', userId) // חשוב! בדיקה שהפריט שייך למשתמש
          .single();

        if (error) throw error;
        result = item;
        break;
      }

      case 'create': {
        // יצירת פריט חדש - מוסיף אוטומטית את user_id
        const { data: newItem, error } = await supabase
          .from(table)
          .insert([{ ...data, user_id: userId }])
          .select()
          .single();

        if (error) throw error;
        result = newItem;
        break;
      }

      case 'update': {
        // עדכון פריט - רק אם שייך למשתמש
        // קודם בודק שהפריט שייך למשתמש
        const { data: existing } = await supabase
          .from(table)
          .select('id')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (!existing) {
          return new Response(
            JSON.stringify({ error: 'Item not found or access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updated, error } = await supabase
          .from(table)
          .update({ ...data, updated_date: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId) // הגנה כפולה
          .select()
          .single();

        if (error) throw error;
        result = updated;
        break;
      }

      case 'delete': {
        // מחיקת פריט - רק אם שייך למשתמש
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id)
          .eq('user_id', userId); // חשוב! בדיקה שהפריט שייך למשתמש

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'getProfile': {
        // קבלת פרטי פרופיל המשתמש
        const { data: user, error } = await supabase
          .from('users')
          .select('id, phone, full_name, email, pin_hash, created_at')
          .eq('id', userId)
          .single();

        if (error) throw error;

        // מחזיר פרטים ללא pin_hash (רק hasPin)
        result = {
          id: user.id,
          phone: user.phone,
          full_name: user.full_name,
          email: user.email,
          hasPin: !!user.pin_hash,
          created_at: user.created_at,
        };
        break;
      }

      case 'updateProfile': {
        // עדכון פרטי פרופיל (שם ואימייל בלבד)
        const { full_name, email } = data;

        const { data: updated, error } = await supabase
          .from('users')
          .update({
            full_name: full_name || null,
            email: email || null,
          })
          .eq('id', userId)
          .select('id, phone, full_name, email, created_at')
          .single();

        if (error) throw error;
        result = updated;
        break;
      }

      case 'setPin': {
        // הגדרת PIN חדש
        const { pin } = data;

        if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
          return new Response(
            JSON.stringify({ error: 'PIN must be 4-6 digits' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // יצירת hash עם userId כ-salt
        const encoder = new TextEncoder();
        const dataToHash = encoder.encode(pin + userId);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const { error } = await supabase
          .from('users')
          .update({ pin_hash: pinHash })
          .eq('id', userId);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'verifyPin': {
        // אימות PIN
        const { pin } = data;

        if (!pin) {
          return new Response(
            JSON.stringify({ error: 'PIN required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // קבלת hash מהדאטאבייס
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('pin_hash')
          .eq('id', userId)
          .single();

        if (fetchError) throw fetchError;

        if (!user.pin_hash) {
          return new Response(
            JSON.stringify({ success: false, error: 'No PIN set' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // יצירת hash לבדיקה
        const encoder = new TextEncoder();
        const dataToHash = encoder.encode(pin + userId);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        result = { success: pinHash === user.pin_hash };
        break;
      }

      case 'clearPin': {
        // איפוס PIN (למחיקה לאחר אימות OTP)
        const { error } = await supabase
          .from('users')
          .update({ pin_hash: null })
          .eq('id', userId);

        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
