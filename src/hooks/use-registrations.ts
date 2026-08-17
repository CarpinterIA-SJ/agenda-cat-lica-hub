import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Registration = Database["public"]["Tables"]["event_registrations"]["Row"];
type RegistrationInsert = Database["public"]["Tables"]["event_registrations"]["Insert"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

/**
 * Pagamentos de um evento (status + valor por inscrição). RLS "payments:
 * admin da org lê" já garante que só o organizador dono enxerga.
 */
export const useEventPayments = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["payments", "event", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("payments").select("*").eq("event_id", eventId);
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!eventId,
  });
};

type OptionCount = Database["public"]["Tables"]["event_option_counts"]["Row"];

/**
 * Contagem de vagas por opção de um evento (Fase C). Leitura pública (RLS
 * `using(true)`) para o formulário marcar opções "(esgotado)". Retorna um
 * mapa `${field_id}::${option_label}` → count.
 */
export const useEventOptionCounts = (eventId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ["option-counts", eventId],
    queryFn: async () => {
      const map: Record<string, number> = {};
      if (!eventId) return map;
      const { data, error } = await supabase
        .from("event_option_counts")
        .select("field_id, option_label, count")
        .eq("event_id", eventId);
      if (error) throw error;
      for (const r of (data as Pick<OptionCount, "field_id" | "option_label" | "count">[]) ?? []) {
        map[`${r.field_id}::${r.option_label}`] = r.count;
      }
      return map;
    },
    enabled: enabled && !!eventId,
  });
};

// Colunas explícitas, SEM cpf: esta lista alimenta a tela do organizador
// (tabela de inscritos + export CSV), que nunca exibiu CPF — select("*")
// entregava o dado em claro no payload de rede mesmo sem nenhuma UI usá-lo.
// Reduz exposição na origem em vez de mascarar na exibição.
const REGISTRATION_LIST_COLUMNS = "id, event_id, ticket_id, full_name, email, phone, status, registered_at";

export const useRegistrations = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_registrations")
        .select(REGISTRATION_LIST_COLUMNS)
        .eq("event_id", eventId);
      if (error) throw error;
      return data as Registration[];
    },
    enabled: !!eventId,
  });
};

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export const useMyRegistrations = () => {
  return useQuery({
    queryKey: ["registrations", "me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*, event:events(*)")
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data as (Registration & { event: EventRow | null })[];
    },
  });
};

export const useCreateRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reg: RegistrationInsert) => {
      const { data, error } = await supabase.from("event_registrations").insert(reg).select().single();
      if (error) throw error;
      return data as Registration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
  });
};

/**
 * LACUNA CONHECIDA (migration 033): cancelar uma inscrição por aqui NÃO
 * devolve o uso do cupom. Este hook roda no cliente e `release_coupon_use` é
 * service_role — de propósito, porque expô-la permitiria devolver/queimar
 * usos em laço, sem inscrição nenhuma.
 *
 * Fazer direito exige uma RPC própria (security definer) que verifique
 * autorização antes de devolver: só admin da organização dona do evento,
 * mesmo predicado de is_event_org_admin. Escopo separado, ainda não feito.
 *
 * Os caminhos automáticos JÁ devolvem: estorno e cobrança não paga, nos dois
 * webhooks e no reconcile-payments.
 */
export const useUpdateRegistrationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Database["public"]["Enums"]["registration_status"] }) => {
      const { data, error } = await supabase
        .from("event_registrations")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Registration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
  });
};