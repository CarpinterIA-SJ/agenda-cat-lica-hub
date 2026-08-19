import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DeleteAccountInput {
  confirmation: string;
  password?: string;
}

interface DeleteAccountBlocked {
  error: "org_owner_blocked";
  message: string;
  organizations: string[];
}

async function extractErrorMessage(fnErr: unknown, fallback: string): Promise<string> {
  const ctx = (fnErr as any)?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      return body?.message || body?.error || fallback;
    } catch {
      /* corpo não-JSON: mantém fallback */
    }
  }
  return (fnErr as Error)?.message || fallback;
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (input: DeleteAccountInput) => {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: input,
      });
      if (error) {
        const message = await extractErrorMessage(error, "Erro ao excluir a conta.");
        throw new Error(message);
      }
      return data as { success: true } | DeleteAccountBlocked;
    },
  });
}
