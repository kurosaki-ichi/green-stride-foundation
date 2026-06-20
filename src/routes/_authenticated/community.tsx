import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Users } from "lucide-react";
import { PostCard } from "@/components/community/PostCard";
import { PostComposer } from "@/components/community/PostComposer";
import { CommunityChallengeCard } from "@/components/community/CommunityChallengeCard";
import { TopContributorsWidget } from "@/components/community/TopContributorsWidget";
import { useFeed, useCommunityChallenges, type FeedScope } from "@/hooks/use-community";
import { cn } from "@/lib/utils";

const SCOPES: { v: FeedScope; label: string }[] = [
  { v: "all", label: "All" },
  { v: "following", label: "Following" },
  { v: "city", label: "My city" },
  { v: "area", label: "My area" },
];

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [
      { title: "Community — EcoRewards AI" },
      { name: "description", content: "Share sustainability wins, inspire your area, and join community challenges." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const [scope, setScope] = useState<FeedScope>("all");
  const { posts, loading, refresh } = useFeed(scope);
  const challenges = useCommunityChallenges();

  return (
    <AppShell
      title="Community"
      subtitle="Real wins from real people."
      right={<PostComposer onCreated={refresh} />}
    >
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        {SCOPES.map((s) => (
          <button key={s.v} onClick={() => setScope(s.v)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors",
              scope === s.v ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border"
            )}>{s.label}</button>
        ))}
      </div>

      {challenges.length > 0 && (
        <section className="mt-4">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Community goals</h3>
          <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-1 snap-x">
            {challenges.map((c) => (
              <div key={c.id} className="w-[270px] shrink-0 snap-start"><CommunityChallengeCard c={c} /></div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-4 space-y-3">
        {loading && <div className="h-40 rounded-3xl bg-muted/40 animate-pulse" />}
        {!loading && posts.length === 0 && (
          <EmptyState
            icon={Users}
            title="No posts yet"
            description="Be the first to share a sustainability win — your post starts the movement."
          />
        )}
        {posts.map((p) => <PostCard key={p.id} post={p} onChange={refresh} />)}
      </section>

      <section className="mt-6"><TopContributorsWidget /></section>
    </AppShell>
  );
}
