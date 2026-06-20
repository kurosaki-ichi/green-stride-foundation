import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type LBRow = Tables<"leaderboard_individual">;
export type AreaRow = Tables<"area_stats">;
export type CityRow = Tables<"city_stats">;
export type StateRow = Tables<"state_stats">;
export type CommunityTotals = Tables<"community_totals">;
export type RankScope = "global" | "state" | "city" | "area";

export function useIndividualLeaderboard(scope: RankScope, ctx?: { state?: string | null; city?: string | null; area?: string | null }) {
  const [rows, setRows] = useState<LBRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("leaderboard_individual").select("*");
      if (scope === "state" && ctx?.state) q = q.eq("state", ctx.state);
      if (scope === "city" && ctx?.state && ctx?.city) q = q.eq("state", ctx.state).eq("city", ctx.city);
      if (scope === "area" && ctx?.state && ctx?.city && ctx?.area)
        q = q.eq("state", ctx.state).eq("city", ctx.city).eq("area", ctx.area);
      const col = scope === "global" ? "global_rank" : scope === "state" ? "state_rank" : scope === "city" ? "city_rank" : "area_rank";
      const { data } = await q.order(col, { ascending: true }).limit(100);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [scope, ctx?.state, ctx?.city, ctx?.area]);

  return { rows, loading };
}

export function useMyRanks(userId?: string | null) {
  const [row, setRow] = useState<LBRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("leaderboard_individual")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      setRow(data ?? null);
      setLoading(false);
    })();
  }, [userId]);

  return { row, loading };
}

export function useAreaStats() {
  const [rows, setRows] = useState<AreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("area_stats").select("*").order("rank", { ascending: true }).limit(50);
      setRows(data ?? []); setLoading(false);
    })();
  }, []);
  return { rows, loading };
}

export function useCityStats() {
  const [rows, setRows] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("city_stats").select("*").order("rank", { ascending: true }).limit(50);
      setRows(data ?? []); setLoading(false);
    })();
  }, []);
  return { rows, loading };
}

export function useStateStats() {
  const [rows, setRows] = useState<StateRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("state_stats").select("*").order("rank", { ascending: true }).limit(50);
      setRows(data ?? []); setLoading(false);
    })();
  }, []);
  return { rows, loading };
}

export function useCommunityTotals() {
  const [totals, setTotals] = useState<CommunityTotals | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("community_totals").select("*").maybeSingle();
      setTotals(data ?? null); setLoading(false);
    })();
  }, []);
  return { totals, loading };
}

export function useRankHistory(userId?: string | null, scope: RankScope = "global") {
  const [rows, setRows] = useState<{ week_start: string; rank: number }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("ranking_history")
        .select("week_start, rank")
        .eq("user_id", userId)
        .eq("scope", scope)
        .order("week_start", { ascending: true })
        .limit(12);
      setRows(data ?? []); setLoading(false);
    })();
  }, [userId, scope]);
  return { rows, loading };
}

export function percentile(rank: number | null | undefined, total: number | null | undefined) {
  if (!rank || !total) return null;
  return Math.max(1, Math.round((rank / total) * 100));
}

export function percentileLabel(pct: number | null) {
  if (pct == null) return null;
  if (pct <= 5) return "Top 5%";
  if (pct <= 10) return "Top 10%";
  if (pct <= 25) return "Top 25%";
  if (pct <= 50) return "Top 50%";
  return `Top ${pct}%`;
}
