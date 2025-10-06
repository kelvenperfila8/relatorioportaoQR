import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const storedUrl = localStorage.getItem('supabaseUrl');
const storedKey = localStorage.getItem('supabaseKey');

const SUPABASE_URL = storedUrl || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = storedKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
