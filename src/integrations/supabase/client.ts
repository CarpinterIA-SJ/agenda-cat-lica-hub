import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { mockSupabase } from './mock-client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Verifica se as credenciais estao presentes. Se nao, usa o mock.
const useMock = !SUPABASE_URL || !/^https?:\/\//.test(SUPABASE_URL);

export const supabase = useMock 
  ? mockSupabase 
  : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
