// Mock client desativado — a aplicação agora usa exclusivamente o Supabase real.
// `mockSupabase` é mantido apenas para não quebrar a importação em client.ts
// (que não pode ser alterado). Qualquer uso lança erro orientando a configurar o .env.
const notConfigured = () => {
  throw new Error(
    '[Supabase] Mock client removido. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.'
  );
};

export const mockSupabase: any = new Proxy(
  {},
  {
    get: () => notConfigured,
  }
);
