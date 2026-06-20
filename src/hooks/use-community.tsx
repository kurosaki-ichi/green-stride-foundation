import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Database } from "@/integrations/supabase/types";

export type FeedScope = "all" | "city" | "area" | "following";
export type FeedPost = Database["public"]["Functions"]["community_feed"]["Returns"][number];
export type CommunityChallenge = Tables<"community_challenges">;
export type Contributor = Database["public"]["Functions"]["top_contributors"]["Returns"][number];

export function useFeed(scope: FeedScope = "all") {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("community_feed", { _scope: scope, _limit: 50 });
    if (error) console.error("[feed]", error);
    setPosts((data as FeedPost[] | null) ?? []);
    setLoading(false);
  }, [scope]);

  useEffect(() => { refresh(); }, [refresh]);
  return { posts, loading, refresh };
}

export type NewPost = {
  type: Database["public"]["Enums"]["post_type"];
  body?: string;
  media_url?: string;
  media_type?: string;
  co2_saved?: number;
  verification?: Database["public"]["Enums"]["post_verification"];
  verification_source?: string;
  source_id?: string;
};

export async function createPost(p: NewPost) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("posts")
    .insert({ ...p, user_id: u.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadMedia(file: File): Promise<{ url: string; type: string }> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("community-media").upload(path, file, {
    cacheControl: "3600", upsert: false,
  });
  if (error) throw error;
  const { data: signed } = await supabase.storage.from("community-media").createSignedUrl(path, 60 * 60 * 24 * 365);
  return { url: signed?.signedUrl ?? "", type: file.type.startsWith("video") ? "video" : "image" };
}

export async function toggleReaction(postId: string, kind: Database["public"]["Enums"]["reaction_kind"] = "like") {
  const { data, error } = await supabase.rpc("toggle_reaction", { _post_id: postId, _kind: kind });
  if (error) throw error;
  return data as boolean;
}

export async function toggleFollow(targetId: string) {
  const { data, error } = await supabase.rpc("toggle_follow", { _target: targetId });
  if (error) throw error;
  return data as boolean;
}

export async function reportPost(postId: string, reason?: string) {
  const { error } = await supabase.rpc("report_post", { _post_id: postId, _reason: reason ?? undefined });
  if (error) throw error;
}

export function useComments(postId: string | null) {
  const [comments, setComments] = useState<Tables<"comments">[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    setComments(data ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (body: string) => {
    if (!postId || !body.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    await supabase.from("comments").insert({ post_id: postId, user_id: u.user.id, body: body.trim() });
    await refresh();
  };

  return { comments, loading, add, refresh };
}

export function useTopContributors(limit = 5) {
  const [list, setList] = useState<Contributor[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("top_contributors", { _limit: limit });
      setList((data as Contributor[] | null) ?? []);
    })();
  }, [limit]);
  return list;
}

export function useCommunityChallenges() {
  const [list, setList] = useState<CommunityChallenge[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("community_challenges").select("*").eq("is_active", true).order("created_at", { ascending: false });
      setList(data ?? []);
    })();
  }, []);
  return list;
}
