import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUserRow {
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-user-list"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_user_list");
      if (error) throw error;
      return (data ?? []) as AdminUserRow[];
    },
  });
};
