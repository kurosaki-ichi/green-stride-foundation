import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { LeaderboardCard } from "@/components/cards/LeaderboardCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Trophy } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import {
  useIndividualLeaderboard, useAreaStats, useCityStats, useStateStats,
  type RankScope,
} from "@/hooks/use-rankings";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — EcoRewards AI" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { profile } = useProfile();
  const ctx = useMemo(
    () => ({ state: profile?.state, city: profile?.city, area: profile?.area }),
    [profile?.state, profile?.city, profile?.area],
  );

  return (
    <AppShell title="Leaderboard" subtitle="See who's leading the green change.">
      <Tabs defaultValue="individual">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="individual" className="rounded-lg">Individuals</TabsTrigger>
          <TabsTrigger value="community" className="rounded-lg">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-4">
          <IndividualPanel ctx={ctx} myId={profile?.id} />
        </TabsContent>

        <TabsContent value="community" className="mt-4">
          <CommunityPanel />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function IndividualPanel({
  ctx, myId,
}: { ctx: { state?: string | null; city?: string | null; area?: string | null }; myId?: string }) {
  return (
    <Tabs defaultValue="global">
      <TabsList className="grid w-full grid-cols-4 rounded-xl">
        <TabsTrigger value="global" className="rounded-lg text-xs">Global</TabsTrigger>
        <TabsTrigger value="state" className="rounded-lg text-xs" disabled={!ctx.state}>State</TabsTrigger>
        <TabsTrigger value="city" className="rounded-lg text-xs" disabled={!ctx.city}>City</TabsTrigger>
        <TabsTrigger value="area" className="rounded-lg text-xs" disabled={!ctx.area}>Area</TabsTrigger>
      </TabsList>
      {(["global", "state", "city", "area"] as RankScope[]).map((scope) => (
        <TabsContent key={scope} value={scope} className="mt-3 space-y-2">
          <IndividualList scope={scope} ctx={ctx} myId={myId} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function IndividualList({
  scope, ctx, myId,
}: { scope: RankScope; ctx: { state?: string | null; city?: string | null; area?: string | null }; myId?: string }) {
  const { rows, loading } = useIndividualLeaderboard(scope, ctx);
  if (loading) return <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;
  if (!rows.length) return <EmptyState icon={Trophy} title="No rankings yet" description="Rankings unlock once more users join your area." />;
  const rankKey = scope === "global" ? "global_rank" : scope === "state" ? "state_rank" : scope === "city" ? "city_rank" : "area_rank";
  return (
    <>
      {rows.map((r) => (
        <LeaderboardCard
          key={r.user_id ?? Math.random()}
          rank={Number(r[rankKey] ?? 0)}
          name={r.user_id === myId ? `${r.name} (You)` : r.name ?? "Anonymous"}
          meta={[r.area, r.city].filter(Boolean).join(" • ") || "—"}
          points={r.green_points ?? 0}
          saved={Number(r.total_saved ?? 0)}
          trustScore={r.trust_score ?? undefined}
          avatar={r.profile_photo}
          highlight={r.user_id === myId}
        />
      ))}
    </>
  );
}

function CommunityPanel() {
  return (
    <Tabs defaultValue="areas">
      <TabsList className="grid w-full grid-cols-3 rounded-xl">
        <TabsTrigger value="areas" className="rounded-lg text-xs">Areas</TabsTrigger>
        <TabsTrigger value="cities" className="rounded-lg text-xs">Cities</TabsTrigger>
        <TabsTrigger value="states" className="rounded-lg text-xs">States</TabsTrigger>
      </TabsList>
      <TabsContent value="areas" className="mt-3 space-y-2"><AreaList /></TabsContent>
      <TabsContent value="cities" className="mt-3 space-y-2"><CityList /></TabsContent>
      <TabsContent value="states" className="mt-3 space-y-2"><StateList /></TabsContent>
    </Tabs>
  );
}

function AreaList() {
  const { rows, loading } = useAreaStats();
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;
  if (!rows.length) return <EmptyState icon={Trophy} title="No areas yet" description="Communities form once users complete onboarding with an area." />;
  return <>{rows.map((r) => (
    <LeaderboardCard
      key={`${r.state}-${r.city}-${r.area}`}
      rank={r.rank ?? 0}
      name={r.area ?? "—"}
      meta={`${r.city} • ${r.active_users} ${r.active_users === 1 ? "user" : "users"}`}
      points={r.total_green_points ?? 0}
      saved={Number(r.total_saved ?? 0)}
    />
  ))}</>;
}

function CityList() {
  const { rows, loading } = useCityStats();
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;
  if (!rows.length) return <EmptyState icon={Trophy} title="No cities yet" description="City rankings will appear as users join." />;
  return <>{rows.map((r) => (
    <LeaderboardCard
      key={`${r.state}-${r.city}`}
      rank={r.rank ?? 0}
      name={r.city ?? "—"}
      meta={`${r.state} • ${r.active_users} users`}
      points={r.total_green_points ?? 0}
      saved={Number(r.total_saved ?? 0)}
    />
  ))}</>;
}

function StateList() {
  const { rows, loading } = useStateStats();
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;
  if (!rows.length) return <EmptyState icon={Trophy} title="No states yet" description="State rankings will appear as users join." />;
  return <>{rows.map((r) => (
    <LeaderboardCard
      key={r.state ?? "—"}
      rank={r.rank ?? 0}
      name={r.state ?? "—"}
      meta={`${r.active_users} users`}
      points={r.total_green_points ?? 0}
      saved={Number(r.total_saved ?? 0)}
    />
  ))}</>;
}
