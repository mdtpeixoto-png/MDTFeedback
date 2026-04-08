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
      ai_error_logs: {
        Row: {
          call_id: string | null
          created_at: string
          error_message: string | null
          id: string
        }
        Insert: {
          call_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
        }
        Update: {
          call_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_error_logs_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedbacks: {
        Row: {
          call_id: string
          created_at: string
          id: string
          score: number | null
          strengths: string | null
          summary: string | null
          tone: string | null
          weaknesses: string | null
        }
        Insert: {
          call_id: string
          created_at?: string
          id?: string
          score?: number | null
          strengths?: string | null
          summary?: string | null
          tone?: string | null
          weaknesses?: string | null
        }
        Update: {
          call_id?: string
          created_at?: string
          id?: string
          score?: number | null
          strengths?: string | null
          summary?: string | null
          tone?: string | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedbacks_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: true
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_tags: {
        Row: {
          call_id: string
          tag_id: string
        }
        Insert: {
          call_id: string
          tag_id: string
        }
        Update: {
          call_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_tags_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          call_datetime: string
          created_at: string
          duration_seconds: number | null
          had_sale: boolean | null
          id: string
          user_id: string
        }
        Insert: {
          call_datetime?: string
          created_at?: string
          duration_seconds?: number | null
          had_sale?: boolean | null
          id?: string
          user_id: string
        }
        Update: {
          call_datetime?: string
          created_at?: string
          duration_seconds?: number | null
          had_sale?: boolean | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          created_at: string
          id: number
          nome_completo: string
        }
        Insert: {
          created_at?: string
          id?: never
          nome_completo: string
        }
        Update: {
          created_at?: string
          id?: never
          nome_completo?: string
        }
        Relationships: []
      }
      idle_time_logs: {
        Row: {
          created_at: string
          days_since_last_sale: number | null
          duration_seconds: number | null
          end_time: string | null
          id: string
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_since_last_sale?: number | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_since_last_sale?: number | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      ligacoes: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          operadora: string | null
          pontos_bons: string | null
          pontos_ruins: string | null
          receita: number | null
          resumo: string | null
          status: boolean | null
          url_audio: string | null
          vendedor_id: number
          vendedor_nome: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          operadora?: string | null
          pontos_bons?: string | null
          pontos_ruins?: string | null
          receita?: number | null
          resumo?: string | null
          status?: boolean | null
          url_audio?: string | null
          vendedor_id: number
          vendedor_nome?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          operadora?: string | null
          pontos_bons?: string | null
          pontos_ruins?: string | null
          receita?: number | null
          resumo?: string | null
          status?: boolean | null
          url_audio?: string | null
          vendedor_id?: number
          vendedor_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ligacoes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          notebook_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          notebook_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          notebook_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_pages_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebooks: {
        Row: {
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          id: string
          period: string | null
          plan: string | null
          product: string
          sale_date: string
          user_id: string
          value: number | null
          week: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          period?: string | null
          plan?: string | null
          product: string
          sale_date?: string
          user_id: string
          value?: number | null
          week?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          period?: string | null
          plan?: string | null
          product?: string
          sale_date?: string
          user_id?: string
          value?: number | null
          week?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "developer" | "admin" | "seller"
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
      app_role: ["developer", "admin", "seller"],
    },
  },
} as const
