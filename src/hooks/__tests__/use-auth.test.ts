import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../use-auth";

beforeEach(() => vi.clearAllMocks());

describe("useAuth", () => {
  it("starts loading and resolves to a session", async () => {
    const session = { user: { id: "u1", email: "a@b.c" }, access_token: "t" } as any;
    (supabase.auth.getSession as any) = vi.fn().mockResolvedValue({ data: { session } });
    (supabase.auth.onAuthStateChange as any) = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.id).toBe("u1");
    expect(result.current.session).toBe(session);
  });

  it("returns null user when no session", async () => {
    (supabase.auth.getSession as any) = vi.fn().mockResolvedValue({ data: { session: null } });
    (supabase.auth.onAuthStateChange as any) = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });
});
