export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          barber_id: string | null
          completed_at: string
          customer_name: string
          id: string
          notes: string | null
          payment_method: string | null
          price_charged: number
          queue_item_id: string | null
          service_id: string | null
        }
        Insert: {
          barber_id?: string | null
          completed_at?: string
          customer_name: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          price_charged: number
          queue_item_id?: string | null
          service_id?: string | null
        }
        Update: {
          barber_id?: string | null
          completed_at?: string
          customer_name?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          price_charged?: number
          queue_item_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      barbers: {
        Row: {
          avatar_url: string | null
          can_add_clients_directly: boolean
          commission_percentage: number
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_available: boolean
          specialty: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_add_clients_directly?: boolean
          commission_percentage?: number
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          specialty?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_add_clients_directly?: boolean
          commission_percentage?: number
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          specialty?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      queue_entry_log: {
        Row: {
          created_at: string
          customer_phone: string
          id: string
        }
        Insert: {
          created_at?: string
          customer_phone: string
          id?: string
        }
        Update: {
          created_at?: string
          customer_phone?: string
          id?: string
        }
        Relationships: []
      }
      queue_items: {
        Row: {
          barber_id: string | null
          called_at: string | null
          completed_at: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          is_called: boolean
          notes: string | null
          origin: string
          priority: string
          service_id: string | null
          status: string
          ticket_number: string
        }
        Insert: {
          barber_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          is_called?: boolean
          notes?: string | null
          origin?: string
          priority?: string
          service_id?: string | null
          status?: string
          ticket_number: string
        }
        Update: {
          barber_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          is_called?: boolean
          notes?: string | null
          origin?: string
          priority?: string
          service_id?: string | null
          status?: string
          ticket_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_items_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_requests: {
        Row: {
          admin_notes: string | null
          barber_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          priority: string
          processed_at: string | null
          processed_by: string | null
          requested_by: string
          service_id: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          barber_id?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          priority?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_by: string
          service_id?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          barber_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          priority?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_by?: string
          service_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_requests_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_settings: {
        Row: {
          closing_time: string
          id: string
          is_active: boolean
          max_queue_size: number
          opening_time: string
          updated_at: string
        }
        Insert: {
          closing_time?: string
          id?: string
          is_active?: boolean
          max_queue_size?: number
          opening_time?: string
          updated_at?: string
        }
        Update: {
          closing_time?: string
          id?: string
          is_active?: boolean
          max_queue_size?: number
          opening_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      queue_transfers: {
        Row: {
          created_at: string
          from_barber_id: string | null
          id: string
          queue_item_id: string
          reason: string | null
          status: string
          to_barber_id: string
        }
        Insert: {
          created_at?: string
          from_barber_id?: string | null
          id?: string
          queue_item_id: string
          reason?: string | null
          status?: string
          to_barber_id: string
        }
        Update: {
          created_at?: string
          from_barber_id?: string | null
          id?: string
          queue_item_id?: string
          reason?: string | null
          status?: string
          to_barber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_transfers_from_barber_id_fkey"
            columns: ["from_barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_transfers_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_transfers_to_barber_id_fkey"
            columns: ["to_barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_walkin_client: {
        Args: {
          p_barber_id?: string
          p_customer_name: string
          p_customer_phone: string
          p_priority?: string
          p_service_id?: string
        }
        Returns: {
          id: string
          ticket_number: string
        }[]
      }
      approve_queue_request: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: string
      }
      barber_complete_service: {
        Args: {
          p_payment_method?: string
          p_price_charged: number
          p_ticket_id: string
        }
        Returns: boolean
      }
      barber_start_service: {
        Args: { p_barber_id: string; p_ticket_id: string }
        Returns: boolean
      }
      cleanup_old_entry_logs: { Args: never; Returns: undefined }
      get_active_services_public: {
        Args: never
        Returns: {
          barber_id: string
          barber_name: string
          customer_first_name: string
          id: string
          priority: string
          service_id: string
          service_status: string
          started_at: string
          ticket_number: string
        }[]
      }
      get_barber_queue: {
        Args: { p_barber_id: string }
        Returns: {
          called_at: string
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          priority: string
          service_id: string
          status: string
          ticket_number: string
        }[]
      }
      get_client_ticket_id: { Args: never; Returns: string }
      get_public_barbers: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          is_available: boolean
          specialty: string
          status: string
        }[]
      }
      get_public_queue: {
        Args: never
        Returns: {
          barber_id: string
          barber_name: string
          called_at: string
          created_at: string
          customer_name_masked: string
          id: string
          priority: string
          service_id: string
          service_name: string
          status: string
          ticket_number: string
        }[]
      }
      get_queue_position: {
        Args: { p_ticket_id: string }
        Returns: {
          queue_position: number
          ticket_priority: string
          ticket_status: string
          total_waiting: number
        }[]
      }
      get_queue_stats: {
        Args: never
        Returns: {
          avg_wait_minutes: number
          in_progress_count: number
          waiting_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_queue: {
        Args: {
          p_barber_id?: string
          p_customer_name: string
          p_customer_phone: string
          p_priority?: string
          p_service_id?: string
        }
        Returns: {
          id: string
          ticket_number: string
        }[]
      }
      leave_queue: { Args: { p_ticket_id: string }; Returns: boolean }
      reject_queue_request: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: boolean
      }
      transfer_queue_client: {
        Args: {
          p_queue_item_id: string
          p_reason?: string
          p_to_barber_id: string
        }
        Returns: boolean
      }
      update_barber_status: {
        Args: { p_barber_id: string; p_is_available: boolean; p_status: string }
        Returns: boolean
      }
      update_barber_status_on_auth: {
        Args: { p_status: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "barber" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "barber", "user"],
    },
  },
} as const
