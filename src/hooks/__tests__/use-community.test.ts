import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { createPost, toggleReaction, toggleFollow, reportPost } from "../use-community";

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("createPost", () => {
  it("throws when user is not signed in", async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: null } });
    await expect(createPost({ type: "text", body: "hi" })).rejects.toThrow(/Not signed in/);
  });

  it("inserts the post for the current user and returns the row", async () => {
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({ data: { id: "p1", body: "hi" }, error: null });
    (supabase.from as any) = vi.fn(() => ({ insert, select, single }));
    const result = await createPost({ type: "text", body: "hi" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ body: "hi", user_id: "user-1" }));
    expect(result).toEqual({ id: "p1", body: "hi" });
  });

  it("surfaces insert errors", async () => {
    (supabase.from as any) = vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "rls violation" } }),
    }));
    await expect(createPost({ type: "text", body: "x" })).rejects.toMatchObject({ message: "rls violation" });
  });
});

describe("toggleReaction / toggleFollow / reportPost", () => {
  it("toggleReaction calls the RPC and returns the boolean", async () => {
    (supabase.rpc as any) = vi.fn().mockResolvedValue({ data: true, error: null });
    await expect(toggleReaction("p1")).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith("toggle_reaction", { _post_id: "p1", _kind: "like" });
  });
  it("toggleFollow throws on error", async () => {
    (supabase.rpc as any) = vi.fn().mockResolvedValue({ data: null, error: { message: "x" } });
    await expect(toggleFollow("t")).rejects.toMatchObject({ message: "x" });
  });
  it("reportPost passes the reason", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    (supabase.rpc as any) = rpc;
    await reportPost("p1", "spam");
    expect(rpc).toHaveBeenCalledWith("report_post", { _post_id: "p1", _reason: "spam" });
  });
});
