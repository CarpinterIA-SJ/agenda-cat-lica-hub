import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Registration = Database["public"]["Tables"]["event_registrations"]["Row"];
type RegistrationInsert = Database["public"]["Tables"]["event_registrations"]["Insert"];

export const useRegistrations = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase.from("event_registrations").select("*").eq("event_id", eventId);
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