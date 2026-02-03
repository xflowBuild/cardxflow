// Supabase Client - חיבור לשרת

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kauxantpdqikmepjiddu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdXhhbnRwZHFpa21lcGppZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTg5MzksImV4cCI6MjA4NTY3NDkzOX0.ILq9kMFOGY3RjRHAZfoPdRFCr8PPo6UlXrbdci9SEsY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current user from localStorage
const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id;
  } catch {
    return null;
  }
};

// Create entity operations factory for Supabase with user filtering
const createEntityOperations = (tableName) => ({
  list: async (sortBy) => {
    const userId = getCurrentUserId();
    let query = supabase.from(tableName).select('*');

    // סנן לפי user_id
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (sortBy) {
      const desc = sortBy.startsWith('-');
      const field = desc ? sortBy.slice(1) : sortBy;
      query = query.order(field, { ascending: !desc });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (itemData) => {
    const userId = getCurrentUserId();

    const { data, error } = await supabase
      .from(tableName)
      .insert([{ ...itemData, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id, itemData) => {
    const { data, error } = await supabase
      .from(tableName)
      .update({ ...itemData, updated_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
});

// Local user for development (no auth required)
const localUser = {
  id: 'anonymous',
  email: 'user@app.com',
  full_name: 'משתמש',
};

// Export client that mimics the same structure as localStorage client
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
    me: async () => localUser,
    logout: () => {
      console.log('Logout called');
    },
  },
};

export { supabase };
export default base44;
