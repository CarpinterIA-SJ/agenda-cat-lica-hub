import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["event_tickets"]["Row"];
type TicketInsert = Database["public"]["Tables"]["event_tickets"]["Insert"];
type TicketUpdate = Database["public"]["Tables"]["event_tickets"]["Update"];

export const useTickets = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["tickets", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_tickets").select("*").eq("event_id", eventId).order("sort_order");
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!eventId,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: Omit<TicketInsert, "price_cents"> & { price_brl?: number }) => {
      const price_cents = ticket.price_brl ? Math.round(ticket.price_brl * 100) : 0;
      const { price_brl, ...rest } = ticket;
      const { data, error } = await supabase.from("event_tickets").insert({ ...rest, price_cents }).select().single();
      if (error) throw error;
      return data as Ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TicketUpdate & { id: string }) => {
      const { data, error } = await supabase.from("event_tickets").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data as Ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};