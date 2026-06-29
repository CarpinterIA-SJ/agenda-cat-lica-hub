import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

const slugify = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

export const useEvents = (
  filters?: { status?: string; visibility?: string; organization_id?: string; organization_ids?: string[] },
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["events", filters],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      let query = supabase.from("events").select("*");
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.visibility) query = query.eq("visibility", filters.visibility);
      // Org única (retrocompat) ou várias orgs (ex: "Meus eventos" do dono com
      // mais de uma organização). Ambos restringem a orgs do usuário — sem
      // vazamento de eventos públicos de terceiros.
      if (filters?.organization_id) query = query.eq("organization_id", filters.organization_id);
      if (filters?.organization_ids) query = query.in("organization_id", filters.organization_ids);
      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });
};

export const useEvent = (id: string | undefined) => {
  return useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!id,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<EventInsert, "slug">) => {
      const slug = slugify(event.name);
      const { data, error } = await supabase.from("events").insert({ ...event, slug }).select().single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: EventUpdate & { id: string }) => {
      const { data, error } = await supabase.from("events").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};