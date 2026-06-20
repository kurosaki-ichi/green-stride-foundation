import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { BadgeCard } from "@/components/cards/BadgeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useBadges } from "@/hooks/use-gamification";
import { Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/badges")({
  head: () => ({ meta: [{ title: "Badges — EcoRewards AI" }] }),
  component: BadgesPage,
});

function BadgesPage() {
  const { all, earned, loading } = useBadges();
  const earnedMap = new Map(earned.map((e) => [e.badge_id, e.earned_at]));
  const unlocked = all.filter((b) => earnedMap.has(b.id));
  const locked = all.filter((b) => !earnedMap.has(b.id));

  return (
    <AppShell title="Badges" subtitle={`${unlocked.length} of ${all.length} unlocked`}>
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : all.length === 0 ? (
        <EmptyState icon={Award} title="No badges yet" description="Check back soon." />
      ) : (
        <>
          {unlocked.length > 0 && (
            <>
              <h2 className="mb-3 text-sm font-semibold">Unlocked</h2>
              <div className="grid grid-cols-2 gap-3">
                {unlocked.map((b) => (
                  <BadgeCard key={b.id} badge={b} earned earnedAt={earnedMap.get(b.id) as string} />
                ))}
              </div>
            </>
          )}
          {locked.length > 0 && (
            <>
              <h2 className="mt-6 mb-3 text-sm font-semibold">Locked</h2>
              <div className="grid grid-cols-2 gap-3">
                {locked.map((b) => <BadgeCard key={b.id} badge={b} earned={false} />)}
              </div>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
