import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lê as variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Cria e exporta o cliente Supabase
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Usa o localStorage para persistir a SESSÃO DO UTILIZADOR (e não a configuração da app)
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
