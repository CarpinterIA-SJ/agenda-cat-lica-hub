import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { mockSupabase } from './mock-client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const hasValidUrl = !!SUPABASE_URL && /^https?:\/\//.test(SUPABASE_URL);
const hasValidKey = !!SUPABASE_PUBLISHABLE_KEY && SUPABASE_PUBLISHABLE_KEY.length > 20;
const useMock = !hasValidUrl || !hasValidKey;

if (useMock) {
  if (import.meta.env.PROD) {
    throw new Error(
      '[Supabase] VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórios em produção. ' +
      'Configure as variáveis de ambiente antes do build.'
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Usando mock client. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env para conectar ao backend real.'
  );
}

export const supabase = useMock
  ? mockSupabase
  : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
