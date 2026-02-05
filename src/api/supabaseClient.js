// Supabase Client - חיבור מאובטח לשרת דרך Edge Function

const DATA_API_URL = 'https://kauxantpdqikmepjiddu.supabase.co/functions/v1/data-api';
const SEND_OTP_URL = 'https://kauxantpdqikmepjiddu.supabase.co/functions/v1/send-otp';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXhhbnRwZHFpa21lcGppZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg5MzksImV4cCI6MjA4NTY3NDkzOX0.ILq9kMFOGY3RjRHAZfoPdRFCr8PPo6UlXrbdci9SEsY';

// Helper to get session token from localStorage
const getSessionToken = () => {
  try {
    return localStorage.getItem('sessionToken');
  } catch {
    return null;
  }
};

// Helper to get current user from localStorage
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

// קריאה מאובטחת ל-Edge Function
const secureApiCall = async (action, table, data = {}) => {
  const sessionToken = getSessionToken();

  if (!sessionToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(DATA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action,
      table,
      sessionToken,
      ...data,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'API call failed');
  }

  return result;
};

// Create entity operations factory - מאובטח דרך Edge Function
const createEntityOperations = (tableName) => ({
  list: async (sortBy) => {
    return await secureApiCall('list', tableName, { sortBy });
  },

  create: async (itemData) => {
    return await secureApiCall('create', tableName, { data: itemData });
  },

  update: async (id, itemData) => {
    return await secureApiCall('update', tableName, { id, data: itemData });
  },

  delete: async (id) => {
    return await secureApiCall('delete', tableName, { id });
  },

  get: async (id) => {
    return await secureApiCall('get', tableName, { id });
  },
});

// קריאה ל-send-otp Edge Function
const sendOtpApiCall = async (data) => {
  const response = await fetch(SEND_OTP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'API call failed');
  }

  return result;
};

// Export client
export const base44 = {
  entities: {
    Card: createEntityOperations('cards'),
    Folder: createEntityOperations('folders'),
    Tag: createEntityOperations('tags'),
    ApiTemplate: {
      list: async () => [], // No API templates table for now
    },
  },
  auth: {
    me: async () => {
      const user = getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      return user;
    },
    logout: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('sessionToken');
      console.log('Logged out');
    },
    // קבלת פרופיל משתמש מהשרת
    getProfile: async () => {
      return await secureApiCall('getProfile', null, {});
    },
    // עדכון פרופיל
    updateProfile: async ({ full_name, email }) => {
      const result = await secureApiCall('updateProfile', null, { data: { full_name, email } });
      // עדכון localStorage
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, full_name, email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return result;
    },
    // הגדרת PIN
    setPin: async (pin) => {
      return await secureApiCall('setPin', null, { data: { pin } });
    },
    // אימות PIN
    verifyPin: async (pin) => {
      return await secureApiCall('verifyPin', null, { data: { pin } });
    },
    // מחיקת PIN
    clearPin: async () => {
      return await secureApiCall('clearPin', null, {});
    },
    // בקשת איפוס PIN (שולח SMS)
    requestPinReset: async (phone) => {
      return await sendOtpApiCall({ phone, action: 'requestPinReset' });
    },
    // אימות OTP לאיפוס PIN
    verifyPinResetOtp: async (phone, otp) => {
      return await sendOtpApiCall({ phone, action: 'verifyPinReset', userOtp: otp });
    },
    // קבלת session token
    getSessionToken: () => {
      return getSessionToken();
    },
  },
};

export default base44;
