import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Reward = Tables<"rewards"> & {
  reward_inventory?: Pick<Tables<"reward_inventory">, "remaining_stock" | "total_stock"> | null;
  reward_categories?: Pick<Tables<"reward_categories">, "name" | "slug" | "icon"> | null;
};
export type Category = Tables<"reward_categories">;
export type Tier = Tables<"membership_tiers">;
export type Coupon = Tables<"coupons"> & { rewards?: Pick<Reward, "title" | "brand" | "image_url"> | null };
export type Redemption = Tables<"redemptions"> & { rewards?: Pick<Reward, "title" | "brand" | "image_url"> | null };

export function useRewardsCatalog() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase
        .from("rewards")
        .select("*, reward_inventory(remaining_stock,total_stock), reward_categories(name,slug,icon)")
        .eq("is_active", true)
        .order("featured", { ascending: false })
        .order("redemption_count", { ascending: false }),
      supabase.from("reward_categories").select("*").order("sort_order"),
    ]);
    setRewards((r ?? []) as Reward[]);
    setCategories(c ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { rewards, categories, loading, refresh };
}

export function useTiers() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("membership_tiers").select("*").order("sort_order");
      setTiers(data ?? []);
    })();
  }, []);
  return tiers;
}

export function useMyTier(lifetimeEarned: number) {
  const tiers = useTiers();
  return useMemo(() => {
    if (tiers.length === 0) return null;
    const sorted = [...tiers].sort((a, b) => a.min_lifetime_points - b.min_lifetime_points);
    let current = sorted[0];
    let next: Tier | null = null;
    for (let i = 0; i < sorted.length; i++) {
      if (lifetimeEarned >= sorted[i].min_lifetime_points) {
        current = sorted[i];
        next = sorted[i + 1] ?? null;
      }
    }
    const span = next ? next.min_lifetime_points - current.min_lifetime_points : 0;
    const progress = next ? Math.min(100, Math.round(((lifetimeEarned - current.min_lifetime_points) / span) * 100)) : 100;
    const remaining = next ? Math.max(0, next.min_lifetime_points - lifetimeEarned) : 0;
    return { current, next, progress, remaining, tiers: sorted };
  }, [tiers, lifetimeEarned]);
}

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    await supabase.rpc("expire_my_coupons");
    const { data } = await supabase
      .from("coupons")
      .select("*, rewards(title,brand,image_url)")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false });
    setCoupons((data ?? []) as Coupon[]);
    setLoading(false);
  }, []);

  const markUsed = useCallback(async (id: string) => {
    await supabase.from("coupons").update({ status: "used", used_at: new Date().toISOString() }).eq("id", id);
    refresh();
  }, [refresh]);

  useEffect(() => { refresh(); }, [refresh]);
  return { coupons, loading, refresh, markUsed };
}

export function useRedemptions() {
  const [items, setItems] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data } = await supabase
      .from("redemptions")
      .select("*, rewards(title,brand,image_url)")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data ?? []) as Redemption[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, refresh };
}

export type SpendResult = {
  coupon_id: string;
  code: string;
  qr_payload: string;
  expires_at: string;
  redemption_id: string;
  points_spent: number;
  new_balance: number;
};

export async function spendPoints(rewardId: string): Promise<SpendResult> {
  const { data, error } = await supabase.rpc("spend_points", { _reward_id: rewardId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Redemption failed");
  return row as SpendResult;
}
