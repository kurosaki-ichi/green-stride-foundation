import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { useMyTier, spendPoints } from "../use-rewards";

const tiers = [
  { name: "Bronze", min_lifetime_points: 0, icon: "medal", color: "#a0a0a0", multiplier: 1 },
  { name: "Silver", min_lifetime_points: 1000, icon: "award", color: "#c0c0c0", multiplier: 1.2 },
  { name: "Gold", min_lifetime_points: 5000, icon: "trophy", color: "#facc15", multiplier: 1.5 },
];

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.from as any) = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: tiers, error: null }),
  }));
});

describe("useMyTier", () => {
  it("returns null when tiers haven't loaded", () => {
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));
    const { result } = renderHook(() => useMyTier(0));
    expect(result.current).toBeNull();
  });

  it("computes current and next tier with progress", async () => {
    const { result } = renderHook(() => useMyTier(2500));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.current.name).toBe("Silver");
    expect(result.current?.next?.name).toBe("Gold");
    expect(result.current?.remaining).toBe(2500);
    expect(result.current?.progress).toBeGreaterThan(0);
    expect(result.current?.progress).toBeLessThanOrEqual(100);
  });

  it("returns 100% progress at top tier with no next", async () => {
    const { result } = renderHook(() => useMyTier(99999));
    await waitFor(() => expect(result.current?.current.name).toBe("Gold"));
    expect(result.current?.next).toBeNull();
    expect(result.current?.progress).toBe(100);
    expect(result.current?.remaining).toBe(0);
  });
});

describe("spendPoints", () => {
  it("returns the redemption row on success", async () => {
    (supabase.rpc as any) = vi.fn().mockResolvedValue({
      data: [{ coupon_id: "c1", code: "ABC", qr_payload: "x", expires_at: "2026-12-31", redemption_id: "r1", points_spent: 100, new_balance: 500 }],
      error: null,
    });
    const r = await spendPoints("reward-1");
    expect(r.coupon_id).toBe("c1");
    expect(r.new_balance).toBe(500);
  });

  it("throws when RPC returns an error", async () => {
    (supabase.rpc as any) = vi.fn().mockResolvedValue({ data: null, error: { message: "insufficient_points" } });
    await expect(spendPoints("r")).rejects.toThrow();
  });

  it("throws when RPC returns no row (overdraft / not found)", async () => {
    (supabase.rpc as any) = vi.fn().mockResolvedValue({ data: null, error: null });
    await expect(spendPoints("r")).rejects.toThrow(/Redemption failed/);
  });
});
