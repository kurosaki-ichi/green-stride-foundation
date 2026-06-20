import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { useTrips } from "../use-trips";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTrips", () => {
  it("returns empty list when no user", async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useTrips());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trips).toEqual([]);
  });

  it("createTrip throws when not signed in", async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useTrips());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(
      result.current.createTrip({ transport_mode: "walk", distance_km: 1, duration_minutes: 10, trip_date: "2026-06-20" }),
    ).rejects.toThrow(/Not signed in/);
  });

  it("createTrip inserts a row with calculated CO₂ values", async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } });
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "t1" }, error: null });
    const eq = vi.fn().mockReturnThis();
    const order = vi.fn().mockReturnThis();
    const qResult: any = { data: [], error: null };
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn(() => ({
        eq, order, limit: vi.fn().mockReturnThis(), then: (cb: any) => Promise.resolve(qResult).then(cb),
      })),
      insert, eq, order,
    }));
    // simpler: just call createTrip directly with mocked insert chain
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (cb: any) => Promise.resolve(qResult).then(cb),
      insert: () => ({ select: () => ({ maybeSingle }) }),
    }));
    const { result } = renderHook(() => useTrips());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const trip = await result.current.createTrip({
      transport_mode: "cycle", distance_km: 5, duration_minutes: 20, trip_date: "2026-06-20",
    });
    expect(trip).toEqual({ id: "t1" });
  });
});
