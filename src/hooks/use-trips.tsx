import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { calcCo2, type TransportMode } from "@/lib/carbon";

export type Trip = Tables<"trips">;

export function useTrips(limit?: number) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setTrips([]);
      setLoading(false);
      return;
    }
    let q = supabase
      .from("trips")
      .select("*")
      .eq("user_id", u.user.id)
      .order("trip_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) setError(error.message);
    setTrips(data ?? []);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTrip = useCallback(
    async (input: {
      transport_mode: TransportMode;
      distance_km: number;
      duration_minutes: number;
      trip_date: string;
      notes?: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { generated, saved } = calcCo2(input.transport_mode, input.distance_km);
      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: u.user.id,
          transport_mode: input.transport_mode,
          distance_km: input.distance_km,
          duration_minutes: input.duration_minutes,
          co2_generated: generated,
          co2_saved: saved,
          verification_type: "manual",
          trip_date: input.trip_date,
          notes: input.notes ?? null,
        })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      await refresh();
      return data;
    },
    [refresh],
  );

  return { trips, loading, error, refresh, createTrip };
}
