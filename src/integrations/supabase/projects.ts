import { supabase } from "./client";
import type { Project, ProjectStatus, TablesInsert, TablesUpdate } from "./types";

/** Lista os projetos de uma organização. */
export async function listProjects(
  organizationId: string,
  status?: ProjectStatus,
): Promise<Project[]> {
  let query = supabase
    .from("projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Retorna um projeto pelo id. */
export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Cria um projeto em uma organização. */
export async function createProject(
  payload: TablesInsert<"projects">,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Atualiza nome, descrição ou status de um projeto. */
export async function updateProject(
  id: string,
  updates: TablesUpdate<"projects">,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Exclui um projeto. */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}
