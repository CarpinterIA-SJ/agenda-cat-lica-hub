import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database, MessageChannel } from "@/integrations/supabase/types";

type EventMessage = Database["public"]["Tables"]["event_messages"]["Row"];

export interface UpsertEventMessageInput {
  id?: string;
  organization_id: string;
  event_id: string;
  channel: MessageChannel;
  subject: string;
  body: string;
}

/** Mensagens (templates) salvas de um evento. */
export const useEventMessages = (eventId: string | undefined, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as EventMessage[];
    },
    enabled: (options?.enabled ?? true) && !!eventId,
  });
};

/** Cria ou atualiza um template de mensagem. Atualiza quando `id` é informado. */
export const useUpsertEventMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, organization_id, event_id, channel, subject, body }: UpsertEventMessageInput) => {
      if (id) {
        const { data, error } = await supabase
          .from("event_messages")
          .update({ channel, subject, body })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as EventMessage;
      }
      const { data, error } = await supabase
        .from("event_messages")
        .insert({ organization_id, event_id, channel, subject, body })
        .select()
        .single();
      if (error) throw error;
      return data as EventMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages"] });
    },
  });
};

/** Remove um template de mensagem. */
export const useDeleteEventMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages"] });
    },
  });
};
