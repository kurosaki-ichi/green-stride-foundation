import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Trophy, ArrowDown, ArrowUp, Minus, Globe, Crown } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useLeaderboardV2, type LBScope, type LBFilter, type LBRow } from "@/hooks/use-phase9";
import { useAreaStats, useCityStats, useStateStats } from "@/hooks/use-rankings";
import { LeaderboardCard as CommunityCard } from "@/components/cards/LeaderboardCard";
import { VerificationBadge } from "@/components/VerificationBadge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — EcoRewards AI" }] }),
  component: LeaderboardPage,
});

const FILTERS: { value: LBFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "most_sustainable", label: "Most Sustainable" },
  { value: "most_improved", label: "Most Improved" },
];

function LeaderboardPage() {
  const { profile } = useProfile();
  const ctx = useMemo(
    () => ({ state: profile?.state, city: profile?.city, area: profile?.area }),
    [profile?.state, profile?.city, profile?.area],
  );

  return (
    <AppShell
      title="Leaderboard"
      subtitle="Trust-weighted Eco Score rankings."
      right={
        <Link to="/impact-globe">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
            <Globe className="h-4 w-4" /> Globe
          </Button>
        </Link>
      }
    >
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
}: {
  ctx: { state?: string | null; city?: string | null; area?: string | null };
  myId?: string;
}) {
  const [scope, setScope] = useState<LBScope>("global");
  const [filter, setFilter] = useState<LBFilter>("all");
  const { rows, loading } = useLeaderboardV2({
    scope, filter, state: ctx.state, city: ctx.city, area: ctx.area, limit: 50,
  });

  return (
    <div className="space-y-3">
      <Tabs value={scope} onValueChange={(v) => setScope(v as LBScope)}>
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="global" className="rounded-lg text-xs">Global</TabsTrigger>
          <TabsTrigger value="state" className="rounded-lg text-xs" disabled={!ctx.state}>State</TabsTrigger>
          <TabsTrigger value="city" className="rounded-lg text-xs" disabled={!ctx.city}>City</TabsTrigger>
          <TabsTrigger value="area" className="rounded-lg text-xs" disabled={!ctx.area}>Area</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Trophy} title="No rankings yet" description="Rankings appear as more users join." />
      ) : (
        <RankList rows={rows} myId={myId} />
      )}
    </div>
  );
}

function RankList({ rows, myId }: { rows: LBRow[]; myId?: string }) {
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <>
      {top3.length === 3 && <Podium rows={top3} />}
      <div className="space-y-2 mt-3">
        {rest.map((r) => (
          <RankRow key={`${r.user_id}`} r={r} highlight={r.user_id === myId} />
        ))}
      </div>
    </>
  );
}

function Podium({ rows }: { rows: LBRow[] }) {
  const navigate = useNavigate();
  // order: 2nd, 1st, 3rd
  const ordered = [rows[1], rows[0], rows[2]];
  const heights = ["h-24", "h-32", "h-20"];
  const tones = [
    "from-slate-300/40 to-slate-200/10 dark:from-slate-500/30 dark:to-slate-700/10",
    "from-amber-400/50 to-amber-200/10 dark:from-amber-500/40 dark:to-amber-700/10",
    "from-orange-400/40 to-orange-200/10 dark:from-orange-500/30 dark:to-orange-700/10",
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-b from-card to-background p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-end justify-around gap-2">
        {ordered.map((r, idx) => {
          const realRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          return (
            <button
              key={r.user_id}
              onClick={() => navigate({ to: "/user/$id", params: { id: r.user_id } })}
              className="flex w-full flex-col items-center text-center group"
            >
              <div className="relative">
                {realRank === 1 && (
                  <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-500" />
                )}
                {r.profile_photo ? (
                  <img src={r.profile_photo} alt="" className={cn(
                    "rounded-full object-cover ring-2 transition group-hover:scale-105",
                    realRank === 1 ? "h-16 w-16 ring-amber-400" :
                    realRank === 2 ? "h-12 w-12 ring-slate-400" : "h-12 w-12 ring-orange-400",
                  )} />
                ) : (
                  <div className={cn(
                    "rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary ring-2",
                    realRank === 1 ? "h-16 w-16 ring-amber-400" :
                    realRank === 2 ? "h-12 w-12 ring-slate-400" : "h-12 w-12 ring-orange-400",
                  )}>
                    {r.name.split(" ").map((s) => s[0]).join("").slice(0,2)}
                  </div>
                )}
              </div>
              <p className="mt-1.5 truncate w-full text-xs font-semibold">{r.name}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">{r.eco_score.toLocaleString()}</p>
              <div className={cn(
                "mt-2 w-full rounded-t-xl bg-gradient-to-b flex items-start justify-center pt-2",
                heights[idx], tones[idx],
              )}>
                <span className={cn(
                  "text-lg font-bold",
                  realRank === 1 && "text-amber-600 dark:text-amber-300",
                  realRank === 2 && "text-slate-600 dark:text-slate-300",
                  realRank === 3 && "text-orange-600 dark:text-orange-300",
                )}>{realRank}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RankRow({ r, highlight }: { r: LBRow; highlight?: boolean }) {
  const navigate = useNavigate();
  const initials = r.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <button
      onClick={() => navigate({ to: "/user/$id", params: { id: r.user_id } })}
      className={cn(
        "w-full flex items-center gap-3 rounded-2xl border border-transparent bg-card p-3 text-left shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]",
        highlight && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold tabular-nums">
        {r.rank}
      </div>
      {r.profile_photo ? (
        <img src={r.profile_photo} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials || "—"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{r.name}</p>
          <VerificationBadge tier={r.tier} size="xs" withLabel={false} />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{[r.area, r.city].filter(Boolean).join(" • ") || "—"}</span>
          <span className="rounded bg-muted px-1.5 py-0.5">Trust {r.trust_score}</span>
          <span className="rounded bg-muted px-1.5 py-0.5">{r.verified_pct}% verified</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-primary tabular-nums">{r.eco_score.toLocaleString()}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Eco</p>
      </div>
      <RankTrendPill change={r.rank_change} />
    </button>
  );
}

function RankTrendPill({ change }: { change: number }) {
  if (!change) {
    return (
      <div className="flex w-8 items-center justify-end text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
      </div>
    );
  }
  const up = change > 0;
  return (
    <div className={cn(
      "flex w-8 items-center justify-end gap-0.5 text-xs font-semibold tabular-nums",
      up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
    )}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      <span>{Math.abs(change)}</span>
    </div>
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
  if (!rows.length) return <EmptyState icon={Trophy} title="No areas yet" description="Communities form once users complete onboarding." />;
  return <>{rows.map((r) => (
    <CommunityCard key={`${r.state}-${r.city}-${r.area}`} rank={r.rank ?? 0} name={r.area ?? "—"}
      meta={`${r.city} • ${r.active_users} ${r.active_users === 1 ? "user" : "users"}`}
      points={r.total_green_points ?? 0} saved={Number(r.total_saved ?? 0)} />
  ))}</>;
}

function CityList() {
  const { rows, loading } = useCityStats();
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;
  if (!rows.length) return <EmptyState icon={Trophy} title="No cities yet" description="City rankings appear as users join." />;
  return <>{rows.map((r) => (
    <CommunityCard key={`${r.state}-${r.city}`} rank={r.rank ?? 0} name={r.city ?? "—"}
      meta={`${r.state} • ${r.active_users} users`}
      points={r.total_green_points ?? 0} saved={Number(r.total_saved ?? 0)} />
  ))}</>;
}

function StateList() {
  const { rows, loading } = useStateStats();
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;
  if (!rows.length) return <EmptyState icon={Trophy} title="No states yet" description="State rankings appear as users join." />;
  return <>{rows.map((r) => (
    <CommunityCard key={r.state ?? "—"} rank={r.rank ?? 0} name={r.state ?? "—"}
      meta={`${r.active_users} users`}
      points={r.total_green_points ?? 0} saved={Number(r.total_saved ?? 0)} />
  ))}</>;
}
