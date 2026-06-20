import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CarbonStats = {
  daily: number;
  weekly: number;
  monthly: number;
  totalSaved: number;
};

export type UserStats = Tables<"user_statistics">;

export function useStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [carbon, setCarbon] = useState<CarbonStats>({
    daily: 0, weekly: 0, monthly: 0, totalSaved: 0,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const uid = u.user.id;

    const [{ data: s }, { data: latest }] = await Promise.all([
      supabase.from("user_statistics").select("*").eq("user_id", uid).maybeSingle(),
      supabase
        .from("carbon_logs")
        .select("*")
        .eq("user_id", uid)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setStats(s ?? null);
    setCarbon({
      daily: Number(latest?.daily_co2 ?? 0),
      weekly: Number(latest?.weekly_co2 ?? 0),
      monthly: Number(latest?.monthly_co2 ?? 0),
      totalSaved: Number(latest?.total_co2_saved ?? s?.total_saved ?? 0),
    });
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, carbon, loading, refresh };
}

export function useWeeklyTrend() {
  const [data, setData] = useState<{ day: string; co2: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const since = new Date();
      since.setDate(since.getDate() - 6);
      const sinceStr = since.toISOString().slice(0, 10);
      const { data: trips } = await supabase
        .from("trips")
        .select("trip_date, co2_generated")
        .eq("user_id", u.user.id)
        .gte("trip_date", sinceStr);
      const days: { day: string; co2: number; date: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        days.push({
          day: d.toLocaleDateString(undefined, { weekday: "short" }),
          date: iso, co2: 0,
        });
      }
      for (const t of trips ?? []) {
        const slot = days.find((d) => d.date === t.trip_date);
        if (slot) slot.co2 += Number(t.co2_generated);
      }
      setData(days.map(({ day, co2 }) => ({ day, co2: +co2.toFixed(2) })));
      setLoading(false);
    })();
  }, []);

  return { data, loading };
}

export function useTransportBreakdown() {
  const [data, setData] = useState<{ name: string; value: number; mode: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data: trips } = await supabase
        .from("trips")
        .select("transport_mode")
        .eq("user_id", u.user.id)
        .gte("trip_date", since.toISOString().slice(0, 10));
      const counts: Record<string, number> = {};
      for (const t of trips ?? []) {
        counts[t.transport_mode] = (counts[t.transport_mode] ?? 0) + 1;
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      const labels: Record<string, string> = {
        walk: "Walk", cycle: "Cycle", bike: "Bike", bus: "Bus",
        metro: "Metro", car: "Car", ev: "EV", auto: "Auto",
      };
      setData(
        Object.entries(counts).map(([mode, c]) => ({
          mode, name: labels[mode] ?? mode, value: Math.round((c / total) * 100),
        })),
      );
      setLoading(false);
    })();
  }, []);

  return { data, loading };
}
