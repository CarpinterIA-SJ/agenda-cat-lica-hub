export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Enums ──────────────────────────────────────────────────────────────────

export type OrgMemberRole = 'owner' | 'admin' | 'member'
export type ProjectStatus  = 'active' | 'archived' | 'draft'

// ─── Row types ──────────────────────────────────────────────────────────────

export interface Profile {
  id:          string
  name:        string | null
  avatar_url:  string | null
  created_at:  string
  updated_at:  string
}

export interface Organization {
  id:         string
  name:       string
  slug:       string
  owner_id:   string
  created_at: string
}

export interface OrganizationMember {
  id:              string
  organization_id: string
  user_id:         string
  role:            OrgMemberRole
  joined_at:       string
}

export interface Project {
  id:              string
  organization_id: string
  name:            string
  description:     string | null
  status:          ProjectStatus
  created_at:      string
  updated_at:      string
}

// ─── Database type (usado pelo createClient<Database>) ──────────────────────

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      profiles: {
        Row:    Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      organizations: {
        Row:    Organization
        Insert: Omit<Organization, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Pick<Organization, 'name' | 'slug'>>
      }
      organization_members: {
        Row:    OrganizationMember
        Insert: Omit<OrganizationMember, 'id' | 'joined_at'> & { id?: string; joined_at?: string }
        Update: Pick<OrganizationMember, 'role'>
      }
      projects: {
        Row:    Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Pick<Project, 'name' | 'description' | 'status'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_org_ids: {
        Args:    Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      org_member_role: OrgMemberRole
      project_status:  ProjectStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Helpers genéricos (compatíveis com o padrão Supabase CLI) ───────────────

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, 'public'>]

export type Tables<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName]['Row']

export type TablesInsert<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName]['Insert']

export type TablesUpdate<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName]['Update']

export type Enums<
  EnumName extends keyof DefaultSchema['Enums'],
> = DefaultSchema['Enums'][EnumName]

export const Constants = {
  public: {
    Enums: {
      org_member_role: ['owner', 'admin', 'member'] as const,
      project_status:  ['active', 'archived', 'draft'] as const,
    },
  },
} as const
