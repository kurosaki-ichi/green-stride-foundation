import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TrustLevel = "eco_leader" | "trusted" | "standard" | "needs_verification";

export const TRUST_LEVELS: Record<TrustLevel, { label: string; color: string; min: number }> = {
  eco_leader: { label: "Verified Eco Leader", color: "var(--color-primary)", min: 90 },
  trusted: { label: "Trusted Member", color: "var(--color-success)", min: 70 },
  standard: { label: "Standard User", color: "var(--color-warning)", min: 50 },
  needs_verification: { label: "Needs Verification", color: "var(--color-destructive)", min: 0 },
};

export function levelFromScore(score: number): TrustLevel {
  if (score >= 90) return "eco_leader";
  if (score >= 70) return "trusted";
  if (score >= 50) return "standard";
  return "needs_verification";
}

export type VerificationRecord = {
  id: string;
  kind: string;
  source: string;
  status: string;
  address: string | null;
  created_at: string;
};

export type VerificationHistory = {
  id: string;
  delta: number;
  reason: string;
  new_score: number;
  created_at: string;
};

export function useVerification() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const [r, h] = await Promise.all([
      supabase.from("verification_records" as any)
        .select("id,kind,source,status,address,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase.from("verification_history" as any)
        .select("id,delta,reason,new_score,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    setRecords((r.data as any) ?? []);
    setHistory((h.data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const record = useCallback(
    async (args: {
      kind: string;
      source: string;
      status?: string;
      latitude?: number;
      longitude?: number;
      address?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.rpc("record_verification" as any, {
        _kind: args.kind,
        _source: args.source,
        _status: args.status ?? "verified",
        _lat: args.latitude ?? null,
        _lng: args.longitude ?? null,
        _address: args.address ?? null,
        _metadata: (args.metadata as any) ?? null,
      });
      if (error) throw error;
      await refresh();
      return data as number;
    },
    [refresh],
  );

  return { records, history, loading, refresh, record };
}
