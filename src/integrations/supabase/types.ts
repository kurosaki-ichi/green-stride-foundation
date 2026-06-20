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
      achievement_history: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points_awarded: number
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points_awarded?: number
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points_awarded?: number
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          code: string
          created_at: string
          criteria_metric: string
          criteria_value: number
          description: string | null
          icon: string | null
          id: string
          name: string
          reward: number
          tier: Database["public"]["Enums"]["badge_tier"]
        }
        Insert: {
          code: string
          created_at?: string
          criteria_metric: string
          criteria_value: number
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          reward?: number
          tier?: Database["public"]["Enums"]["badge_tier"]
        }
        Update: {
          code?: string
          created_at?: string
          criteria_metric?: string
          criteria_value?: number
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          reward?: number
          tier?: Database["public"]["Enums"]["badge_tier"]
        }
        Relationships: []
      }
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
      challenges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          ends_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          metric: Database["public"]["Enums"]["challenge_metric"]
          reward: number
          starts_at: string | null
          target: number
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          metric: Database["public"]["Enums"]["challenge_metric"]
          reward?: number
          starts_at?: string | null
          target: number
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          metric?: Database["public"]["Enums"]["challenge_metric"]
          reward?: number
          starts_at?: string | null
          target?: number
          title?: string
          type?: Database["public"]["Enums"]["challenge_type"]
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source: Database["public"]["Enums"]["point_source"]
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source: Database["public"]["Enums"]["point_source"]
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: Database["public"]["Enums"]["point_source"]
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      points_wallet: {
        Row: {
          balance: number
          lifetime_earned: number
          lifetime_spent: number
          month_anchor: string
          month_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          month_anchor?: string
          month_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          month_anchor?: string
          month_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string | null
          city: string | null
          commute_km: number | null
          country: string | null
          created_at: string
          current_rank: number | null
          email: string | null
          green_points: number
          home_address: string | null
          home_lat: number | null
          home_lng: number | null
          id: string
          latitude: number | null
          location_verified: boolean
          longitude: number | null
          name: string | null
          onboarding_complete: boolean
          primary_goal: string | null
          profile_photo: string | null
          state: string | null
          transport_habits: string[] | null
          trust_level: string
          trust_score: number
          updated_at: string
          verification_source: string | null
          work_address: string | null
          work_lat: number | null
          work_lng: number | null
        }
        Insert: {
          area?: string | null
          city?: string | null
          commute_km?: number | null
          country?: string | null
          created_at?: string
          current_rank?: number | null
          email?: string | null
          green_points?: number
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          id: string
          latitude?: number | null
          location_verified?: boolean
          longitude?: number | null
          name?: string | null
          onboarding_complete?: boolean
          primary_goal?: string | null
          profile_photo?: string | null
          state?: string | null
          transport_habits?: string[] | null
          trust_level?: string
          trust_score?: number
          updated_at?: string
          verification_source?: string | null
          work_address?: string | null
          work_lat?: number | null
          work_lng?: number | null
        }
        Update: {
          area?: string | null
          city?: string | null
          commute_km?: number | null
          country?: string | null
          created_at?: string
          current_rank?: number | null
          email?: string | null
          green_points?: number
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          id?: string
          latitude?: number | null
          location_verified?: boolean
          longitude?: number | null
          name?: string | null
          onboarding_complete?: boolean
          primary_goal?: string | null
          profile_photo?: string | null
          state?: string | null
          transport_habits?: string[] | null
          trust_level?: string
          trust_score?: number
          updated_at?: string
          verification_source?: string | null
          work_address?: string | null
          work_lat?: number | null
          work_lng?: number | null
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
      referrals: {
        Row: {
          code: string
          completed_at: string | null
          created_at: string
          id: string
          points_awarded: number
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          code: string
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          code?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
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
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          claimed_at: string | null
          completed: boolean
          completed_at: string | null
          id: string
          period_start: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          id?: string
          period_start?: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          id?: string
          period_start?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
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
      verification_history: {
        Row: {
          created_at: string
          delta: number
          id: string
          new_score: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          new_score: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          new_score?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_records: {
        Row: {
          address: string | null
          created_at: string
          id: string
          kind: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          source: string
          status: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          kind: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          source: string
          status?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          kind?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          source?: string
          status?: string
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
      _area_stats: {
        Args: never
        Returns: {
          active_users: number
          area: string
          avg_co2: number
          avg_saved: number
          city: string
          rank: number
          state: string
          total_co2: number
          total_green_points: number
          total_saved: number
        }[]
      }
      _city_stats: {
        Args: never
        Returns: {
          active_users: number
          avg_co2: number
          avg_saved: number
          city: string
          rank: number
          state: string
          total_co2: number
          total_green_points: number
          total_saved: number
        }[]
      }
      _community_totals: {
        Args: never
        Returns: {
          total_co2: number
          total_distance: number
          total_green_points: number
          total_saved: number
          total_trips: number
          total_users: number
        }[]
      }
      _leaderboard_individual: {
        Args: never
        Returns: {
          area: string
          area_rank: number
          challenge_count: number
          city: string
          city_rank: number
          global_rank: number
          green_points: number
          name: string
          profile_photo: string
          state: string
          state_rank: number
          total_co2: number
          total_distance: number
          total_saved: number
          total_trips: number
          total_users: number
          trust_score: number
          user_id: string
        }[]
      }
      _state_stats: {
        Args: never
        Returns: {
          active_users: number
          avg_co2: number
          avg_saved: number
          rank: number
          state: string
          total_co2: number
          total_green_points: number
          total_saved: number
        }[]
      }
      award_points: {
        Args: {
          _amount: number
          _description?: string
          _source: Database["public"]["Enums"]["point_source"]
          _source_id?: string
          _user_id: string
        }
        Returns: undefined
      }
      evaluate_badges: { Args: { _user_id: string }; Returns: undefined }
      points_for_trip: {
        Args: {
          _distance: number
          _mode: Database["public"]["Enums"]["transport_mode"]
        }
        Returns: number
      }
      recompute_challenges: { Args: { _user_id: string }; Returns: undefined }
      recompute_trust_score: { Args: { _user_id: string }; Returns: number }
      record_verification: {
        Args: {
          _address?: string
          _kind: string
          _lat?: number
          _lng?: number
          _metadata?: Json
          _source: string
          _status?: string
        }
        Returns: number
      }
      redeem_referral: { Args: { _code: string }; Returns: undefined }
      snapshot_rankings: { Args: never; Returns: undefined }
      sync_user_rank: { Args: { _user_id: string }; Returns: undefined }
      update_streak: {
        Args: { _date: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      badge_tier: "bronze" | "silver" | "gold" | "platinum"
      challenge_metric:
        | "distance_walk"
        | "distance_cycle"
        | "trips_public"
        | "trips_total"
        | "co2_saved"
        | "distance_total"
      challenge_type: "daily" | "weekly" | "monthly" | "seasonal"
      point_source:
        | "trip"
        | "challenge"
        | "badge"
        | "referral"
        | "bonus"
        | "manual"
        | "social"
      referral_status: "pending" | "completed"
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
      badge_tier: ["bronze", "silver", "gold", "platinum"],
      challenge_metric: [
        "distance_walk",
        "distance_cycle",
        "trips_public",
        "trips_total",
        "co2_saved",
        "distance_total",
      ],
      challenge_type: ["daily", "weekly", "monthly", "seasonal"],
      point_source: [
        "trip",
        "challenge",
        "badge",
        "referral",
        "bonus",
        "manual",
        "social",
      ],
      referral_status: ["pending", "completed"],
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
