import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "../use-profile";

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } });
});

describe("useProfile", () => {
  it("loads the profile for the current user", async () => {
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "u1", name: "Alice" }, error: null }),
    }));
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile?.name).toBe("Alice");
  });

  it("returns null when no user is signed in", async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toBeNull();
  });

  it("update throws when not signed in", async () => {
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: null } });
    await expect(result.current.update({ name: "x" } as any)).rejects.toThrow(/Not signed in/);
  });
});
