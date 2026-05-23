import { supabase } from "./client";
import type { Profile, TablesUpdate } from "./types";

/** Retorna o perfil do usuário autenticado. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Atualiza campos do perfil do usuário autenticado. */
export async function updateProfile(
  userId: string,
  updates: TablesUpdate<"profiles">,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
