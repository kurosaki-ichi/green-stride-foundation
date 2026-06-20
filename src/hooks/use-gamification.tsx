import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Wallet = Tables<"points_wallet">;
export type PointTx = Tables<"point_transactions">;
export type Challenge = Tables<"challenges">;
export type UserChallenge = Tables<"user_challenges">;
export type Badge = Tables<"badges">;
export type UserBadge = Tables<"user_badges">;
export type Streak = Tables<"streaks">;
export type Referral = Tables<"referrals">;
export type Achievement = Tables<"achievement_history">;

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<PointTx[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const [{ data: w }, { data: t }] = await Promise.all([
      supabase.from("points_wallet").select("*").eq("user_id", u.user.id).maybeSingle(),
      supabase.from("point_transactions").select("*").eq("user_id", u.user.id)
        .order("created_at", { ascending: false }).limit(50),
    ]);
    setWallet(w ?? null);
    setTxs(t ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { wallet, txs, loading, refresh };
}

export type ChallengeWithProgress = Challenge & {
  progress: number;
  completed: boolean;
  claimed_at: string | null;
  user_challenge_id: string | null;
};

export function useChallenges() {
  const [items, setItems] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }

    // Trigger a server-side recompute so UI reflects current period
    await supabase.rpc("recompute_challenges", { _user_id: u.user.id });
    await supabase.rpc("evaluate_badges", { _user_id: u.user.id });

    const [{ data: ch }, { data: uc }] = await Promise.all([
      supabase.from("challenges").select("*").eq("is_active", true),
      supabase.from("user_challenges").select("*").eq("user_id", u.user.id),
    ]);

    const merged: ChallengeWithProgress[] = (ch ?? []).map((c) => {
      const u = (uc ?? []).find((x) => x.challenge_id === c.id);
      return {
        ...c,
        progress: Number(u?.progress ?? 0),
        completed: !!u?.completed,
        claimed_at: u?.claimed_at ?? null,
        user_challenge_id: u?.id ?? null,
      };
    });
    setItems(merged);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, refresh };
}

export function useBadges() {
  const [all, setAll] = useState<Badge[]>([]);
  const [earned, setEarned] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const [{ data: b }, { data: ub }] = await Promise.all([
      supabase.from("badges").select("*").order("criteria_value", { ascending: true }),
      supabase.from("user_badges").select("*").eq("user_id", u.user.id),
    ]);
    setAll(b ?? []);
    setEarned(ub ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { all, earned, loading, refresh };
}

export function useStreak() {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data } = await supabase.from("streaks").select("*").eq("user_id", u.user.id).maybeSingle();
      setStreak(data ?? null);
      setLoading(false);
    })();
  }, []);

  return { streak, loading };
}

export function useReferrals() {
  const [code, setCode] = useState<string | null>(null);
  const [items, setItems] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data } = await supabase
      .from("referrals").select("*").eq("referrer_id", u.user.id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    // Use first existing code, else derive a stable code from user id
    const existing = (data ?? [])[0]?.code;
    setCode(existing ?? `ECO-${u.user.id.slice(0, 6).toUpperCase()}`);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const generateLink = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const newCode = `ECO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { error } = await supabase.from("referrals").insert({
      referrer_id: u.user.id, code: newCode, status: "pending",
    });
    if (error) throw error;
    await refresh();
    return newCode;
  }, [refresh]);

  const earned = items.filter((i) => i.status === "completed")
    .reduce((s, i) => s + (i.points_awarded ?? 0), 0);

  return { code, items, earned, loading, refresh, generateLink };
}

export function useAchievements(limit = 20) {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const { data } = await supabase.from("achievement_history").select("*")
        .eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(limit);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [limit]);
  return { items, loading };
}
