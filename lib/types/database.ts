export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      autoresponders: {
        Row: {
          body: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          mailbox_id: string
          starts_at: string | null
          subject: string | null
        }
        Insert: {
          body?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          mailbox_id: string
          starts_at?: string | null
          subject?: string | null
        }
        Update: {
          body?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          mailbox_id?: string
          starts_at?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autoresponders_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          catch_all_mailbox_id: string | null
          created_at: string | null
          dkim_status: string | null
          dmarc_status: string | null
          domain_name: string
          id: string
          is_verified: boolean | null
          last_dns_check_at: string | null
          mx_status: string | null
          org_id: string
          send_enabled: boolean | null
          spf_status: string | null
          verification_token: string
        }
        Insert: {
          catch_all_mailbox_id?: string | null
          created_at?: string | null
          dkim_status?: string | null
          dmarc_status?: string | null
          domain_name: string
          id?: string
          is_verified?: boolean | null
          last_dns_check_at?: string | null
          mx_status?: string | null
          org_id: string
          send_enabled?: boolean | null
          spf_status?: string | null
          verification_token?: string
        }
        Update: {
          catch_all_mailbox_id?: string | null
          created_at?: string | null
          dkim_status?: string | null
          dmarc_status?: string | null
          domain_name?: string
          id?: string
          is_verified?: boolean | null
          last_dns_check_at?: string | null
          mx_status?: string | null
          org_id?: string
          send_enabled?: boolean | null
          spf_status?: string | null
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_domains_catch_all"
            columns: ["catch_all_mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          bounce_reason: string | null
          cf_message_id: string | null
          created_at: string | null
          id: string
          mailbox_id: string
          org_id: string
          status: string | null
          subject: string | null
          to_address: string
        }
        Insert: {
          bounce_reason?: string | null
          cf_message_id?: string | null
          created_at?: string | null
          id?: string
          mailbox_id: string
          org_id: string
          status?: string | null
          subject?: string | null
          to_address: string
        }
        Update: {
          bounce_reason?: string | null
          cf_message_id?: string | null
          created_at?: string | null
          id?: string
          mailbox_id?: string
          org_id?: string
          status?: string | null
          subject?: string | null
          to_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          attachments: Json | null
          bcc_address: string | null
          body_html: string | null
          body_text: string | null
          cc_address: string | null
          created_at: string | null
          folder: string | null
          from_address: string
          id: string
          in_reply_to: string | null
          is_read: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          mailbox_id: string
          message_id: string | null
          org_id: string
          raw_headers: Json | null
          received_at: string | null
          references_header: string[] | null
          sent_at: string | null
          subject: string | null
          to_address: string
        }
        Insert: {
          attachments?: Json | null
          bcc_address?: string | null
          body_html?: string | null
          body_text?: string | null
          cc_address?: string | null
          created_at?: string | null
          folder?: string | null
          from_address: string
          id?: string
          in_reply_to?: string | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          mailbox_id: string
          message_id?: string | null
          org_id: string
          raw_headers?: Json | null
          received_at?: string | null
          references_header?: string[] | null
          sent_at?: string | null
          subject?: string | null
          to_address: string
        }
        Update: {
          attachments?: Json | null
          bcc_address?: string | null
          body_html?: string | null
          body_text?: string | null
          cc_address?: string | null
          created_at?: string | null
          folder?: string | null
          from_address?: string
          id?: string
          in_reply_to?: string | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          mailbox_id?: string
          message_id?: string | null
          org_id?: string
          raw_headers?: Json | null
          received_at?: string | null
          references_header?: string[] | null
          sent_at?: string | null
          subject?: string | null
          to_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      forwarding_rules: {
        Row: {
          created_at: string | null
          forward_to: string
          id: string
          is_active: boolean | null
          keep_copy: boolean | null
          mailbox_id: string
        }
        Insert: {
          created_at?: string | null
          forward_to: string
          id?: string
          is_active?: boolean | null
          keep_copy?: boolean | null
          mailbox_id: string
        }
        Update: {
          created_at?: string | null
          forward_to?: string
          id?: string
          is_active?: boolean | null
          keep_copy?: boolean | null
          mailbox_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forwarding_rules_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      mailbox_aliases: {
        Row: {
          alias_address: string
          created_at: string | null
          id: string
          mailbox_id: string
        }
        Insert: {
          alias_address: string
          created_at?: string | null
          id?: string
          mailbox_id: string
        }
        Update: {
          alias_address?: string
          created_at?: string | null
          id?: string
          mailbox_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailbox_aliases_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      mailboxes: {
        Row: {
          address: string
          created_at: string | null
          display_name: string | null
          domain_id: string
          id: string
          is_active: boolean | null
          org_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          display_name?: string | null
          domain_id: string
          id?: string
          is_active?: boolean | null
          org_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          display_name?: string | null
          domain_id?: string
          id?: string
          is_active?: boolean | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailboxes_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mailboxes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_send_quotas: {
        Row: {
          daily_limit: number | null
          org_id: string
          reset_at: string | null
          sent_today: number | null
        }
        Insert: {
          daily_limit?: number | null
          org_id: string
          reset_at?: string | null
          sent_today?: number | null
        }
        Update: {
          daily_limit?: number | null
          org_id?: string
          reset_at?: string | null
          sent_today?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "org_send_quotas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          html_body: string | null
          id: string
          is_default: boolean | null
          mailbox_id: string
        }
        Insert: {
          html_body?: string | null
          id?: string
          is_default?: boolean | null
          mailbox_id: string
        }
        Update: {
          html_body?: string | null
          id?: string
          is_default?: boolean | null
          mailbox_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_send_quota: { Args: { target_org_id: string }; Returns: boolean }
      resolve_mailbox: {
        Args: { target_address: string }
        Returns: {
          address: string
          display_name: string
          domain_id: string
          mailbox_id: string
          org_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
