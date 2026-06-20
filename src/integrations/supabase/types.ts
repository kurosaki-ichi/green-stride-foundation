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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      carbon_logs: {
        Row: {
          created_at: string
          daily_co2: number
          date: string
          id: string
          monthly_co2: number
          total_co2_saved: number
          updated_at: string
          user_id: string
          weekly_co2: number
        }
        Insert: {
          created_at?: string
          daily_co2?: number
          date?: string
          id?: string
          monthly_co2?: number
          total_co2_saved?: number
          updated_at?: string
          user_id: string
          weekly_co2?: number
        }
        Update: {
          created_at?: string
          daily_co2?: number
          date?: string
          id?: string
          monthly_co2?: number
          total_co2_saved?: number
          updated_at?: string
          user_id?: string
          weekly_co2?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          current_rank: number | null
          email: string | null
          green_points: number
          id: string
          name: string | null
          onboarding_complete: boolean
          primary_goal: string | null
          profile_photo: string | null
          state: string | null
          transport_habits: string[] | null
          trust_score: number
          updated_at: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          current_rank?: number | null
          email?: string | null
          green_points?: number
          id: string
          name?: string | null
          onboarding_complete?: boolean
          primary_goal?: string | null
          profile_photo?: string | null
          state?: string | null
          transport_habits?: string[] | null
          trust_score?: number
          updated_at?: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          current_rank?: number | null
          email?: string | null
          green_points?: number
          id?: string
          name?: string | null
          onboarding_complete?: boolean
          primary_goal?: string | null
          profile_photo?: string | null
          state?: string | null
          transport_habits?: string[] | null
          trust_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      ranking_history: {
        Row: {
          created_at: string
          green_points: number
          id: string
          rank: number
          scope: string
          total_saved: number
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          green_points?: number
          id?: string
          rank: number
          scope: string
          total_saved?: number
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          green_points?: number
          id?: string
          rank?: number
          scope?: string
          total_saved?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          co2_generated: number
          co2_saved: number
          created_at: string
          distance_km: number
          duration_minutes: number
          id: string
          notes: string | null
          transport_mode: Database["public"]["Enums"]["transport_mode"]
          trip_date: string
          user_id: string
          verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Insert: {
          co2_generated?: number
          co2_saved?: number
          created_at?: string
          distance_km?: number
          duration_minutes?: number
          id?: string
          notes?: string | null
          transport_mode: Database["public"]["Enums"]["transport_mode"]
          trip_date?: string
          user_id: string
          verification_type?: Database["public"]["Enums"]["verification_type"]
        }
        Update: {
          co2_generated?: number
          co2_saved?: number
          created_at?: string
          distance_km?: number
          duration_minutes?: number
          id?: string
          notes?: string | null
          transport_mode?: Database["public"]["Enums"]["transport_mode"]
          trip_date?: string
          user_id?: string
          verification_type?: Database["public"]["Enums"]["verification_type"]
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          badge_count: number
          challenge_count: number
          total_co2: number
          total_distance: number
          total_saved: number
          total_trips: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_count?: number
          challenge_count?: number
          total_co2?: number
          total_distance?: number
          total_saved?: number
          total_trips?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_count?: number
          challenge_count?: number
          total_co2?: number
          total_distance?: number
          total_saved?: number
          total_trips?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      area_stats: {
        Row: {
          active_users: number | null
          area: string | null
          avg_co2: number | null
          avg_saved: number | null
          city: string | null
          rank: number | null
          state: string | null
          total_co2: number | null
          total_green_points: number | null
          total_saved: number | null
        }
        Relationships: []
      }
      city_stats: {
        Row: {
          active_users: number | null
          avg_co2: number | null
          avg_saved: number | null
          city: string | null
          rank: number | null
          state: string | null
          total_co2: number | null
          total_green_points: number | null
          total_saved: number | null
        }
        Relationships: []
      }
      community_totals: {
        Row: {
          total_co2: number | null
          total_distance: number | null
          total_green_points: number | null
          total_saved: number | null
          total_trips: number | null
          total_users: number | null
        }
        Relationships: []
      }
      leaderboard_individual: {
        Row: {
          area: string | null
          area_rank: number | null
          challenge_count: number | null
          city: string | null
          city_rank: number | null
          global_rank: number | null
          green_points: number | null
          name: string | null
          profile_photo: string | null
          state: string | null
          state_rank: number | null
          total_co2: number | null
          total_distance: number | null
          total_saved: number | null
          total_trips: number | null
          total_users: number | null
          trust_score: number | null
          user_id: string | null
        }
        Relationships: []
      }
      state_stats: {
        Row: {
          active_users: number | null
          avg_co2: number | null
          avg_saved: number | null
          rank: number | null
          state: string | null
          total_co2: number | null
          total_green_points: number | null
          total_saved: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      snapshot_rankings: { Args: never; Returns: undefined }
      sync_user_rank: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      transport_mode:
        | "walk"
        | "cycle"
        | "bike"
        | "bus"
        | "metro"
        | "car"
        | "ev"
        | "auto"
      verification_type: "manual" | "gps" | "ticket" | "receipt"
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
      transport_mode: [
        "walk",
        "cycle",
        "bike",
        "bus",
        "metro",
        "car",
        "ev",
        "auto",
      ],
      verification_type: ["manual", "gps", "ticket", "receipt"],
    },
  },
} as const
