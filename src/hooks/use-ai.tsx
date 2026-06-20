import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Database } from "@/integrations/supabase/types";

export type SustainabilityScore = Database["public"]["Functions"]["sustainability_score"]["Returns"][number];
export type CarbonForecast = Database["public"]["Functions"]["carbon_forecast"]["Returns"][number];
export type Goal = Tables<"user_goals">;
export type Recommendation = Tables<"ai_recommendations">;

export function useSustainabilityScore() {
  const [score, setScore] = useState<SustainabilityScore | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data } = await supabase.rpc("sustainability_score", { _user_id: u.user.id });
      setScore((data?.[0] as SustainabilityScore) ?? null);
      setLoading(false);
    })();
  }, []);
  return { score, loading };
}

export function useForecast(horizonDays = 30) {
  const [forecast, setForecast] = useState<CarbonForecast | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data } = await supabase.rpc("carbon_forecast", { _user_id: u.user.id, _horizon_days: horizonDays });
      setForecast((data?.[0] as CarbonForecast) ?? null);
      setLoading(false);
    })();
  }, [horizonDays]);
  return { forecast, loading };
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("user_goals").select("*").order("created_at", { ascending: false });
    setGoals(data ?? []); setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (g: Pick<Goal, "kind" | "title" | "description" | "target" | "unit" | "deadline">) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    await supabase.from("user_goals").insert({ ...g, user_id: u.user.id });
    await refresh();
  };

  const updateValue = async (id: string, current_value: number) => {
    await supabase.from("user_goals").update({ current_value, updated_at: new Date().toISOString() }).eq("id", id);
    await refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("user_goals").delete().eq("id", id);
    await refresh();
  };

  return { goals, loading, create, updateValue, remove, refresh };
}

export function useRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const refresh = useCallback(async () => {
    const { data } = await supabase.from("ai_recommendations").select("*").eq("dismissed", false).order("created_at", { ascending: false }).limit(8);
    setItems(data ?? []);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const dismiss = async (id: string) => {
    await supabase.from("ai_recommendations").update({ dismissed: true }).eq("id", id);
    await refresh();
  };
  return { items, dismiss, refresh };
}
