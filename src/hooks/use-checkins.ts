import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type CheckinType = Database["public"]["Tables"]["checkin_types"]["Row"];
type CheckinTypeInsert = Database["public"]["Tables"]["checkin_types"]["Insert"];
type Checkin = Database["public"]["Tables"]["checkins"]["Row"];
type CheckinInsert = Database["public"]["Tables"]["checkins"]["Insert"];

export const useCheckinTypes = (eventId: string | undefined, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["checkin-types", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("checkin_types")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at");
      if (error) throw error;
      return data as CheckinType[];
    },
    enabled: (options?.enabled ?? true) && !!eventId,
  });
};

export const useCreateCheckinType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: CheckinTypeInsert) => {
      const { data, error } = await supabase.from("checkin_types").insert(type).select().single();
      if (error) throw error;
      return data as CheckinType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkin-types"] });
    },
  });
};

export const useDeleteCheckinType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checkin_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkin-types"] });
    },
  });
};

export const useCheckins = (eventId: string | undefined, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["checkins", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("checkins")
        .select("*, registration:event_registrations(*)")
        .eq("event_id", eventId)
        .order("checked_at", { ascending: false });
      if (error) throw error;
      return data as (Checkin & { registration: Database["public"]["Tables"]["event_registrations"]["Row"] | null })[];
    },
    enabled: (options?.enabled ?? true) && !!eventId,
  });
};

export const useCreateCheckin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (checkin: CheckinInsert) => {
      const { data, error } = await supabase.from("checkins").insert(checkin).select().single();
      if (error) throw error;
      return data as Checkin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      queryClient.invalidateQueries({ queryKey: ["checkin-types"] });
    },
  });
};
