import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { useStats } from "../use-stats";

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } });
});

describe("useStats", () => {
  it("returns zeros when there are no logs", async () => {
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.carbon.daily).toBe(0);
    expect(result.current.carbon.totalSaved).toBe(0);
  });

  it("maps the latest carbon log into the carbon stats", async () => {
    const responses = [
      { data: { total_saved: 99 }, error: null },
      { data: { daily_co2: 1.2, weekly_co2: 8, monthly_co2: 32, total_co2_saved: 50 }, error: null },
    ];
    let call = 0;
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(responses[call++])),
    }));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.carbon.daily).toBe(1.2);
    expect(result.current.carbon.weekly).toBe(8);
    expect(result.current.carbon.monthly).toBe(32);
    expect(result.current.carbon.totalSaved).toBe(50);
  });

  it("stops loading when no user is signed in", async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
