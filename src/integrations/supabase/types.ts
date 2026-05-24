export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Enums ──────────────────────────────────────────────────────────────────
// Migration 001
export type OrgMemberRole       = 'owner' | 'admin' | 'member'
export type ProjectStatus       = 'active' | 'archived' | 'draft'

// Migration 003
export type EventVisibility     = 'public' | 'private'
export type EventStatus         = 'draft' | 'active' | 'paused' | 'archived'
export type EventFormat         = 'presencial' | 'online' | 'hibrido'
export type TicketType          = 'pago' | 'gratuito'
export type RegistrationStatus  = 'pending' | 'confirmed' | 'cancelled' | 'waitlist'
export type PaymentStatus       = 'pending' | 'paid' | 'refunded' | 'failed' | 'cancelled'
export type PaymentMethod       = 'credit_card' | 'pix' | 'boleto' | 'free'
export type DiscountKind        = 'percent' | 'fixed'
export type MessageChannel      = 'email' | 'whatsapp' | 'system'

// Migration 004
export type AppRole             = 'superadmin' | 'admin' | 'support' | 'organizer' | 'participant'

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

export interface Event {
  id:               string
  organization_id:  string
  created_by:       string | null
  name:             string
  slug:             string
  description:      string | null
  description_text: string | null
  banner_url:       string | null
  category:         string | null
  format:           EventFormat
  visibility:       EventVisibility
  status:           EventStatus
  start_at:         string | null
  end_at:           string | null
  location:         Json | null
  custom_fields:    Json
  show_fields:      Json
  created_at:       string
  updated_at:       string
}

export interface EventTicket {
  id:           string
  event_id:     string
  name:         string
  type:         TicketType
  price_cents:  number
  quantity:     number
  sold:         number
  visibility:   EventVisibility
  status:       string
  pass_fees:    boolean
  sort_order:   number
  created_at:   string
  updated_at:   string
}

export interface EventRegistration {
  id:             string
  event_id:       string
  ticket_id:      string | null
  user_id:        string | null
  full_name:      string
  email:          string
  cpf:            string | null
  phone:          string | null
  birth_date:     string | null
  custom_fields:  Json
  status:         RegistrationStatus
  registered_at:  string
  updated_at:     string
}

export interface CheckinType {
  id:              string
  organization_id: string
  event_id:        string | null
  name:            string
  description:     string | null
  active:          boolean
  created_at:      string
}

export interface Checkin {
  id:               string
  event_id:         string
  registration_id:  string
  checkin_type_id:  string | null
  performed_by:     string | null
  checked_at:       string
  notes:            string | null
}

export interface Coupon {
  id:              string
  organization_id: string
  event_id:        string | null
  code:            string
  discount_kind:   DiscountKind
  discount_value:  number
  max_uses:        number | null
  used_count:      number
  starts_at:       string | null
  expires_at:      string | null
  active:          boolean
  created_at:      string
}

export interface EventMessage {
  id:              string
  organization_id: string
  event_id:        string | null
  created_by:      string | null
  channel:         MessageChannel
  subject:         string | null
  body:            string
  audience:        Json
  scheduled_at:    string | null
  sent_at:         string | null
  created_at:      string
}

export interface CrmContact {
  id:              string
  organization_id: string
  full_name:       string
  email:           string | null
  phone:           string | null
  cpf:             string | null
  tags:            Json
  source:          string | null
  notes:           string | null
  created_at:      string
  updated_at:      string
}

export interface UserRole {
  id:          string
  user_id:     string
  role:        AppRole
  granted_by:  string | null
  granted_at:  string
}

export interface Payment {
  id:                      string
  organization_id:         string
  event_id:                string | null
  registration_id:         string | null
  coupon_id:               string | null
  amount_cents:            number
  fee_cents:               number
  net_cents:               number
  currency:                string
  method:                  PaymentMethod
  status:                  PaymentStatus
  gateway:                 string | null
  gateway_transaction_id:  string | null
  gateway_payload:         Json | null
  paid_at:                 string | null
  refunded_at:             string | null
  created_at:              string
  updated_at:              string
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
      events: {
        Row:    Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
          format?:      EventFormat
          visibility?:  EventVisibility
          status?:      EventStatus
          custom_fields?: Json
          show_fields?:   Json
        }
        Update: Partial<Omit<Event, 'id' | 'organization_id' | 'created_at'>>
      }
      event_tickets: {
        Row:    EventTicket
        Insert: Omit<EventTicket, 'id' | 'created_at' | 'updated_at' | 'sold'> & {
          id?: string
          created_at?: string
          updated_at?: string
          sold?: number
          type?: TicketType
          visibility?: EventVisibility
          price_cents?: number
          quantity?: number
          status?: string
          pass_fees?: boolean
          sort_order?: number
        }
        Update: Partial<Omit<EventTicket, 'id' | 'event_id' | 'created_at'>>
      }
      event_registrations: {
        Row:    EventRegistration
        Insert: Omit<EventRegistration, 'id' | 'registered_at' | 'updated_at'> & {
          id?: string
          registered_at?: string
          updated_at?: string
          status?: RegistrationStatus
          custom_fields?: Json
        }
        Update: Partial<Omit<EventRegistration, 'id' | 'event_id' | 'registered_at'>>
      }
      checkin_types: {
        Row:    CheckinType
        Insert: Omit<CheckinType, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
          active?: boolean
        }
        Update: Partial<Omit<CheckinType, 'id' | 'organization_id' | 'created_at'>>
      }
      checkins: {
        Row:    Checkin
        Insert: Omit<Checkin, 'id' | 'checked_at'> & {
          id?: string
          checked_at?: string
        }
        Update: Partial<Pick<Checkin, 'checkin_type_id' | 'notes'>>
      }
      coupons: {
        Row:    Coupon
        Insert: Omit<Coupon, 'id' | 'used_count' | 'created_at'> & {
          id?: string
          used_count?: number
          created_at?: string
          active?: boolean
        }
        Update: Partial<Omit<Coupon, 'id' | 'organization_id' | 'created_at'>>
      }
      event_messages: {
        Row:    EventMessage
        Insert: Omit<EventMessage, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
          channel?: MessageChannel
          audience?: Json
        }
        Update: Partial<Omit<EventMessage, 'id' | 'organization_id' | 'created_at'>>
      }
      crm_contacts: {
        Row:    CrmContact
        Insert: Omit<CrmContact, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
          tags?: Json
        }
        Update: Partial<Omit<CrmContact, 'id' | 'organization_id' | 'created_at'>>
      }
      user_roles: {
        Row:    UserRole
        Insert: Omit<UserRole, 'id' | 'granted_at'> & {
          id?: string
          granted_at?: string
          granted_by?: string | null
        }
        Update: Partial<Pick<UserRole, 'role'>>
      }
      payments: {
        Row:    Payment
        // Insert/Update normalmente bloqueados via RLS para authenticated/anon.
        // Tipos são mantidos para uso em Edge Functions (service_role).
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'net_cents'> & {
          id?: string
          created_at?: string
          updated_at?: string
          net_cents?: number
          currency?: string
          status?: PaymentStatus
          fee_cents?: number
        }
        Update: Partial<Omit<Payment, 'id' | 'organization_id' | 'created_at'>>
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
      user_admin_org_ids: {
        Args:    Record<PropertyKey, never>
        Returns: string[]
      }
      is_event_org_admin: {
        Args:    { p_event_id: string }
        Returns: boolean
      }
      event_is_public_active: {
        Args:    { p_event_id: string }
        Returns: boolean
      }
      has_role: {
        Args:    { p_role: AppRole }
        Returns: boolean
      }
      is_superadmin: {
        Args:    Record<PropertyKey, never>
        Returns: boolean
      }
      is_platform_admin: {
        Args:    Record<PropertyKey, never>
        Returns: boolean
      }
      validate_coupon: {
        Args:    { p_event_id: string; p_code: string }
        Returns: {
          valid:          boolean
          discount_kind:  DiscountKind | null
          discount_value: number | null
        }[]
      }
    }
    Enums: {
      org_member_role:     OrgMemberRole
      project_status:      ProjectStatus
      event_visibility:    EventVisibility
      event_status:        EventStatus
      event_format:        EventFormat
      ticket_type:         TicketType
      registration_status: RegistrationStatus
      payment_status:      PaymentStatus
      payment_method:      PaymentMethod
      discount_kind:       DiscountKind
      message_channel:     MessageChannel
      app_role:            AppRole
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
      org_member_role:     ['owner', 'admin', 'member'] as const,
      project_status:      ['active', 'archived', 'draft'] as const,
      event_visibility:    ['public', 'private'] as const,
      event_status:        ['draft', 'active', 'paused', 'archived'] as const,
      event_format:        ['presencial', 'online', 'hibrido'] as const,
      ticket_type:         ['pago', 'gratuito'] as const,
      registration_status: ['pending', 'confirmed', 'cancelled', 'waitlist'] as const,
      payment_status:      ['pending', 'paid', 'refunded', 'failed', 'cancelled'] as const,
      payment_method:      ['credit_card', 'pix', 'boleto', 'free'] as const,
      discount_kind:       ['percent', 'fixed'] as const,
      message_channel:     ['email', 'whatsapp', 'system'] as const,
      app_role:            ['superadmin', 'admin', 'support', 'organizer', 'participant'] as const,
    },
  },
} as const
