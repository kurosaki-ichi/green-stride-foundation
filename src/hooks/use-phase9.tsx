import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LBScope = "global" | "state" | "city" | "area";
export type LBFilter = "all" | "verified" | "most_improved" | "most_sustainable";

export type LBRow = {
  user_id: string;
  is_demo: boolean;
  name: string;
  profile_photo: string | null;
  state: string | null;
  city: string | null;
  area: string | null;
  green_points: number;
  trust_score: number;
  verified_pct: number;
  total_saved: number;
  total_trips: number;
  challenge_count: number;
  eco_score: number;
  tier: string;
  rank: number;
  previous_rank: number | null;
  rank_change: number;
};

export function useLeaderboardV2(params: {
  scope: LBScope;
  filter: LBFilter;
  state?: string | null;
  city?: string | null;
  area?: string | null;
  limit?: number;
}) {
  const [rows, setRows] = useState<LBRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { scope, filter, state, city, area, limit = 50 } = params;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await (supabase.rpc as any)("leaderboard_v2", {
        _scope: scope,
        _filter: filter,
        _state: state ?? null,
        _city: city ?? null,
        _area: area ?? null,
        _limit: limit,
      });
      if (cancelled) return;
      if (error) console.error("leaderboard_v2", error);
      setRows((data as LBRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, filter, state, city, area, limit]);

  return { rows, loading };
}

export type GlobePoint = {
  id: string;
  is_demo: boolean;
  name: string;
  lat: number;
  lng: number;
  state: string | null;
  city: string | null;
  area: string | null;
  green_points: number;
  trust_score: number;
  verified_pct: number;
  eco_score: number;
  tier: string;
  total_saved: number;
  home_lat: number | null;
  home_lng: number | null;
  work_lat: number | null;
  work_lng: number | null;
};

export function useGlobeData(limit = 600) {
  const [points, setPoints] = useState<GlobePoint[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [{ data: pts }, { data: cls }] = await Promise.all([
        (supabase.rpc as any)("globe_points", { _limit: limit }),
        (supabase.rpc as any)("globe_clusters"),
      ]);
      setPoints((pts as GlobePoint[]) ?? []);
      setClusters((cls as any[]) ?? []);
      setLoading(false);
    })();
  }, [limit]);
  return { points, clusters, loading };
}

export function usePublicProfile(userId: string | undefined) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    (async () => {
      const { data: d } = await (supabase.rpc as any)("public_profile", { _user_id: userId });
      setData(d);
      setLoading(false);
    })();
  }, [userId]);
  return { data, loading };
}

export function tierColor(tier: string): string {
  switch (tier) {
    case "eco_leader":
      return "#10B981";
    case "community_champion":
      return "#F59E0B";
    case "trusted_contributor":
      return "#0EA5E9";
    case "eco_explorer":
      return "#84CC16";
    default:
      return "#94A3B8";
  }
}
