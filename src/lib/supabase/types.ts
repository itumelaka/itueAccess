export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          after_data: Json
          before_data: Json
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string
        }
        Insert: {
          action: string
          actor_id: string
          after_data: Json
          before_data: Json
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason: string
        }
        Update: {
          action?: string
          actor_id?: string
          after_data?: Json
          before_data?: Json
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string
          created_by: string
          id: string
          imported_rows: number
          issue_rows: number
          source_name: string
          source_rows: number
          source_sha256: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          imported_rows?: number
          issue_rows?: number
          source_name: string
          source_rows: number
          source_sha256: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          imported_rows?: number
          issue_rows?: number
          source_name?: string
          source_rows?: number
          source_sha256?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_issues: {
        Row: {
          batch_id: string
          id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          source_data: Json
          source_row: number
        }
        Insert: {
          batch_id: string
          id?: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_data: Json
          source_row: number
        }
        Update: {
          batch_id?: string
          id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_data?: Json
          source_row?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_issues_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          category: Database["public"]["Enums"]["user_category"] | null
          created_at: string
          display_name: string
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["user_category"] | null
          created_at?: string
          display_name: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["user_category"] | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          check_in_at: string
          check_in_request_id: string
          check_out_at: string | null
          check_out_request_id: string | null
          created_at: string
          guest_name: string | null
          guest_organization: string | null
          guest_purpose: string | null
          id: string
          location_id: string
          person_type: Database["public"]["Enums"]["person_type"]
          profile_id: string | null
          recorded_by: string
          source: Database["public"]["Enums"]["visit_source"]
          updated_at: string
        }
        Insert: {
          check_in_at?: string
          check_in_request_id: string
          check_out_at?: string | null
          check_out_request_id?: string | null
          created_at?: string
          guest_name?: string | null
          guest_organization?: string | null
          guest_purpose?: string | null
          id?: string
          location_id: string
          person_type: Database["public"]["Enums"]["person_type"]
          profile_id?: string | null
          recorded_by: string
          source: Database["public"]["Enums"]["visit_source"]
          updated_at?: string
        }
        Update: {
          check_in_at?: string
          check_in_request_id?: string
          check_out_at?: string | null
          check_out_request_id?: string | null
          created_at?: string
          guest_name?: string | null
          guest_organization?: string | null
          guest_purpose?: string | null
          id?: string
          location_id?: string
          person_type?: Database["public"]["Enums"]["person_type"]
          profile_id?: string | null
          recorded_by?: string
          source?: Database["public"]["Enums"]["visit_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_check_out_guest: {
        Args: { p_request_id: string; p_visit_id: string }
        Returns: {
          check_in_at: string
          check_in_request_id: string
          check_out_at: string | null
          check_out_request_id: string | null
          created_at: string
          guest_name: string | null
          guest_organization: string | null
          guest_purpose: string | null
          id: string
          location_id: string
          person_type: Database["public"]["Enums"]["person_type"]
          profile_id: string | null
          recorded_by: string
          source: Database["public"]["Enums"]["visit_source"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "visits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_in: {
        Args: { p_location_code: string; p_request_id: string }
        Returns: {
          check_in_at: string
          check_in_request_id: string
          check_out_at: string | null
          check_out_request_id: string | null
          created_at: string
          guest_name: string | null
          guest_organization: string | null
          guest_purpose: string | null
          id: string
          location_id: string
          person_type: Database["public"]["Enums"]["person_type"]
          profile_id: string | null
          recorded_by: string
          source: Database["public"]["Enums"]["visit_source"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "visits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_out: {
        Args: { p_request_id: string }
        Returns: {
          check_in_at: string
          check_in_request_id: string
          check_out_at: string | null
          check_out_request_id: string | null
          created_at: string
          guest_name: string | null
          guest_organization: string | null
          guest_purpose: string | null
          id: string
          location_id: string
          person_type: Database["public"]["Enums"]["person_type"]
          profile_id: string | null
          recorded_by: string
          source: Database["public"]["Enums"]["visit_source"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "visits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      register_guest: {
        Args: {
          p_location_id: string
          p_name: string
          p_organization: string
          p_purpose: string
          p_request_id: string
        }
        Returns: {
          check_in_at: string
          check_in_request_id: string
          check_out_at: string | null
          check_out_request_id: string | null
          created_at: string
          guest_name: string | null
          guest_organization: string | null
          guest_purpose: string | null
          id: string
          location_id: string
          person_type: Database["public"]["Enums"]["person_type"]
          profile_id: string | null
          recorded_by: string
          source: Database["public"]["Enums"]["visit_source"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "visits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "ADMIN" | "USER"
      person_type: "USER" | "GUEST"
      profile_status: "PENDING" | "ACTIVE" | "SUSPENDED"
      user_category: "STAFF" | "PELATIH"
      visit_source: "PWA" | "ADMIN" | "IMPORT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["ADMIN", "USER"],
      person_type: ["USER", "GUEST"],
      profile_status: ["PENDING", "ACTIVE", "SUSPENDED"],
      user_category: ["STAFF", "PELATIH"],
      visit_source: ["PWA", "ADMIN", "IMPORT"],
    },
  },
} as const

