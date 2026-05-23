import { supabase } from "./client";
import type {
  Organization,
  OrganizationMember,
  OrgMemberRole,
  TablesInsert,
  TablesUpdate,
} from "./types";

// ─── Organizations ───────────────────────────────────────────────────────────

/** Lista as organizações do usuário autenticado. */
export async function listOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Retorna uma organização pelo id. */
export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Cria uma organização e adiciona o criador como owner. */
export async function createOrganization(
  payload: TablesInsert<"organizations">,
): Promise<Organization> {
  const { data, error } = await supabase
    .from("organizations")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  // Adiciona o dono como membro 'owner'
  await supabase.from("organization_members").insert({
    organization_id: data.id,
    user_id: payload.owner_id,
    role: "owner",
  });

  return data;
}

/** Atualiza nome ou slug de uma organização. */
export async function updateOrganization(
  id: string,
  updates: TablesUpdate<"organizations">,
): Promise<Organization> {
  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Exclui uma organização (cascata remove membros e projetos). */
export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) throw error;
}

// ─── Members ─────────────────────────────────────────────────────────────────

/** Lista os membros de uma organização. */
export async function listMembers(organizationId: string): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .order("joined_at");

  if (error) throw error;
  return data ?? [];
}

/** Adiciona um membro a uma organização. */
export async function addMember(
  organizationId: string,
  userId: string,
  role: OrgMemberRole = "member",
): Promise<OrganizationMember> {
  const { data, error } = await supabase
    .from("organization_members")
    .insert({ organization_id: organizationId, user_id: userId, role })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Altera o papel de um membro. */
export async function updateMemberRole(
  memberId: string,
  role: OrgMemberRole,
): Promise<OrganizationMember> {
  const { data, error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Remove um membro de uma organização. */
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
}
