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
    PostgrestVersion: "13.0.5"
  }
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
      answers: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          question_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          question_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          question_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          answer_id: string
          comment_text: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          answer_id: string
          comment_text: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          comment_text?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          active_from: string
          active_until: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question_text: string
        }
        Insert: {
          active_from: string
          active_until?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question_text: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question_text?: string
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          created_at: string | null
          id: string
          phone_last_4: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          phone_last_4: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          phone_last_4?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          answer_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      session_questions: {
        Row: {
          id: string
          question_text: string
          category: 'date' | 'friend_group' | 'deep' | 'party'
          created_at: string
        }
        Insert: {
          id?: string
          question_text: string
          category: 'date' | 'friend_group' | 'deep' | 'party'
          created_at?: string
        }
        Update: {
          id?: string
          question_text?: string
          category?: 'date' | 'friend_group' | 'deep' | 'party'
          created_at?: string
        }
        Relationships: []
      }
      play_sessions: {
        Row: {
          id: string
          room_code: string
          host_user_id: string
          categories: string[]
          allow_guests: boolean
          status: 'lobby' | 'active' | 'ended'
          current_question_id: string | null
          current_asker_index: number
          question_unlocked_at: string | null
          question_index: number
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          room_code: string
          host_user_id: string
          categories: string[]
          allow_guests?: boolean
          status?: 'lobby' | 'active' | 'ended'
          current_question_id?: string | null
          current_asker_index?: number
          question_unlocked_at?: string | null
          question_index?: number
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          room_code?: string
          host_user_id?: string
          categories?: string[]
          allow_guests?: boolean
          status?: 'lobby' | 'active' | 'ended'
          current_question_id?: string | null
          current_asker_index?: number
          question_unlocked_at?: string | null
          question_index?: number
          created_at?: string
          ended_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "play_sessions_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_sessions_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "session_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      play_participants: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          display_name: string
          is_host: boolean
          join_order: number
          joined_at: string
          left_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          display_name: string
          is_host?: boolean
          join_order: number
          joined_at?: string
          left_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          display_name?: string
          is_host?: boolean
          join_order?: number
          joined_at?: string
          left_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "play_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "play_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      play_session_log: {
        Row: {
          id: string
          session_id: string
          question_id: string
          asker_participant_id: string
          shown_at: string
          skipped: boolean
          skip_reason: string | null
          skip_requested_by: string | null
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          asker_participant_id: string
          shown_at?: string
          skipped?: boolean
          skip_reason?: string | null
          skip_requested_by?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          asker_participant_id?: string
          shown_at?: string
          skipped?: boolean
          skip_reason?: string | null
          skip_requested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "play_session_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "play_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_session_log_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "session_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_session_question: {
        Args: {
          p_session_id: string
          p_skip?: boolean
          p_skip_reason?: string | null
        }
        Returns: void
      }
      start_play_session: {
        Args: {
          p_session_id: string
        }
        Returns: void
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
    Enums: {},
  },
} as const