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
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          is_hidden: boolean
          like_count: number
          parent_id: string | null
          post_id: string
          reported_count: number
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          like_count?: number
          parent_id?: string | null
          post_id: string
          reported_count?: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          like_count?: number
          parent_id?: string | null
          post_id?: string
          reported_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_challenges: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          current_progress: number
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          metric: string
          reward: number
          scope: Database["public"]["Enums"]["community_scope"]
          starts_at: string
          state: string | null
          target: number
          title: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          current_progress?: number
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          metric: string
          reward?: number
          scope: Database["public"]["Enums"]["community_scope"]
          starts_at?: string
          state?: string | null
          target: number
          title: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          current_progress?: number
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          metric?: string
          reward?: number
          scope?: Database["public"]["Enums"]["community_scope"]
          starts_at?: string
          state?: string | null
          target?: number
          title?: string
        }
        Relationships: []
      }
      community_progress: {
        Row: {
          challenge_id: string
          contribution: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          contribution?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          contribution?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "community_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          qr_payload: string
          redemption_id: string
          reward_id: string
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          qr_payload: string
          redemption_id: string
          reward_id: string
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          qr_payload?: string
          redemption_id?: string
          reward_id?: string
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      membership_tiers: {
        Row: {
          benefits: Json
          color: string | null
          created_at: string
          icon: string | null
          id: string
          min_lifetime_points: number
          multiplier: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          benefits?: Json
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          min_lifetime_points?: number
          multiplier?: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          benefits?: Json
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          min_lifetime_points?: number
          multiplier?: number
          name?: string
          slug?: string
          sort_order?: number
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
      post_media: {
        Row: {
          created_at: string
          id: string
          kind: string
          position: number
          post_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          position?: number
          post_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          position?: number
          post_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          area: string | null
          body: string | null
          city: string | null
          co2_saved: number | null
          comment_count: number
          created_at: string
          id: string
          is_hidden: boolean
          like_count: number
          media_type: string | null
          media_url: string | null
          points_earned: number | null
          reported_count: number
          share_count: number
          source_id: string | null
          state: string | null
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
          user_id: string
          verification: Database["public"]["Enums"]["post_verification"]
          verification_source: string | null
        }
        Insert: {
          area?: string | null
          body?: string | null
          city?: string | null
          co2_saved?: number | null
          comment_count?: number
          created_at?: string
          id?: string
          is_hidden?: boolean
          like_count?: number
          media_type?: string | null
          media_url?: string | null
          points_earned?: number | null
          reported_count?: number
          share_count?: number
          source_id?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id: string
          verification?: Database["public"]["Enums"]["post_verification"]
          verification_source?: string | null
        }
        Update: {
          area?: string | null
          body?: string | null
          city?: string | null
          co2_saved?: number | null
          comment_count?: number
          created_at?: string
          id?: string
          is_hidden?: boolean
          like_count?: number
          media_type?: string | null
          media_url?: string | null
          points_earned?: number | null
          reported_count?: number
          share_count?: number
          source_id?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id?: string
          verification?: Database["public"]["Enums"]["post_verification"]
          verification_source?: string | null
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
      redemptions: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          reward_id: string
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          reward_id: string
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
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
      reward_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      reward_inventory: {
        Row: {
          remaining_stock: number | null
          reward_id: string
          total_stock: number | null
          updated_at: string
        }
        Insert: {
          remaining_stock?: number | null
          reward_id: string
          total_stock?: number | null
          updated_at?: string
        }
        Update: {
          remaining_stock?: number | null
          reward_id?: string
          total_stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_inventory_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: true
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          brand: string
          cash_value: number | null
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          min_tier: string
          points_cost: number
          recommended: boolean
          redemption_count: number
          terms: string | null
          title: string
          trending: boolean
          updated_at: string
          validity_days: number
        }
        Insert: {
          brand: string
          cash_value?: number | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          min_tier?: string
          points_cost: number
          recommended?: boolean
          redemption_count?: number
          terms?: string | null
          title: string
          trending?: boolean
          updated_at?: string
          validity_days?: number
        }
        Update: {
          brand?: string
          cash_value?: number | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          min_tier?: string
          points_cost?: number
          recommended?: boolean
          redemption_count?: number
          terms?: string | null
          title?: string
          trending?: boolean
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "rewards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "reward_categories"
            referencedColumns: ["id"]
          },
        ]
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
      user_rewards: {
        Row: {
          favourited_at: string
          reward_id: string
          user_id: string
        }
        Insert: {
          favourited_at?: string
          reward_id: string
          user_id: string
        }
        Update: {
          favourited_at?: string
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
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
      community_feed: {
        Args: { _limit?: number; _scope?: string }
        Returns: {
          area: string
          author_area: string
          author_city: string
          author_name: string
          author_photo: string
          body: string
          city: string
          co2_saved: number
          comment_count: number
          created_at: string
          id: string
          like_count: number
          media_type: string
          media_url: string
          points_earned: number
          share_count: number
          state: string
          type: Database["public"]["Enums"]["post_type"]
          user_id: string
          verification: Database["public"]["Enums"]["post_verification"]
          viewer_liked: boolean
        }[]
      }
      evaluate_badges: { Args: { _user_id: string }; Returns: undefined }
      expire_my_coupons: { Args: never; Returns: number }
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
      report_post: {
        Args: { _post_id: string; _reason?: string }
        Returns: undefined
      }
      reward_analytics: {
        Args: never
        Returns: {
          brand: string
          image_url: string
          last_redeemed: string
          points_cost: number
          redemption_count: number
          reward_id: string
          title: string
        }[]
      }
      snapshot_rankings: { Args: never; Returns: undefined }
      spend_points: {
        Args: { _reward_id: string }
        Returns: {
          code: string
          coupon_id: string
          expires_at: string
          new_balance: number
          points_spent: number
          qr_payload: string
          redemption_id: string
        }[]
      }
      sync_user_rank: { Args: { _user_id: string }; Returns: undefined }
      tier_for_points: {
        Args: { _lifetime: number }
        Returns: {
          min_lifetime_points: number
          multiplier: number
          name: string
          next_slug: string
          next_threshold: number
          slug: string
        }[]
      }
      toggle_follow: { Args: { _target: string }; Returns: boolean }
      toggle_reaction: {
        Args: {
          _kind?: Database["public"]["Enums"]["reaction_kind"]
          _post_id: string
        }
        Returns: boolean
      }
      top_contributors: {
        Args: { _limit?: number }
        Returns: {
          area: string
          city: string
          green_points: number
          likes_received: number
          name: string
          photo: string
          posts: number
          user_id: string
        }[]
      }
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
      community_scope: "area" | "city" | "state"
      point_source:
        | "trip"
        | "challenge"
        | "badge"
        | "referral"
        | "bonus"
        | "manual"
        | "social"
        | "redemption"
        | "social_post"
        | "social_engagement"
      post_type:
        | "text"
        | "image"
        | "video"
        | "achievement"
        | "challenge"
        | "trip"
        | "milestone"
      post_verification: "verified" | "unverified" | "community_supported"
      reaction_kind: "like" | "celebrate" | "inspiring" | "eco_hero"
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
      community_scope: ["area", "city", "state"],
      point_source: [
        "trip",
        "challenge",
        "badge",
        "referral",
        "bonus",
        "manual",
        "social",
        "redemption",
        "social_post",
        "social_engagement",
      ],
      post_type: [
        "text",
        "image",
        "video",
        "achievement",
        "challenge",
        "trip",
        "milestone",
      ],
      post_verification: ["verified", "unverified", "community_supported"],
      reaction_kind: ["like", "celebrate", "inspiring", "eco_hero"],
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
