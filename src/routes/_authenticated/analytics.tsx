import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/cards/ChartCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, Leaf, Sparkles, Route as RouteIcon, MapPin } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import {
  useCommunityTotals, useAreaStats, useCityStats, useStateStats,
} from "@/hooks/use-rankings";
import { useProfile } from "@/hooks/use-profile";
import { useStats } from "@/hooks/use-stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Community Analytics — EcoRewards AI" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { totals, loading: tLoading } = useCommunityTotals();
  const { rows: areas, loading: aLoading } = useAreaStats();
  const { rows: cities, loading: cLoading } = useCityStats();
  const { rows: states, loading: sLoading } = useStateStats();
  const { profile } = useProfile();
  const { stats } = useStats();

  // Compare my performance to my area average
  const myArea = areas.find(
    (a) => a.state === profile?.state && a.city === profile?.city && a.area === profile?.area,
  );
  const myCity = cities.find((c) => c.state === profile?.state && c.city === profile?.city);
  const myState = states.find((s) => s.state === profile?.state);

  const myCo2 = Number(stats?.total_co2 ?? 0);
  const areaAvg = Number(myArea?.avg_co2 ?? 0);
  const comparison = areaAvg > 0
    ? Math.round(((areaAvg - myCo2) / areaAvg) * 100)
    : null;

  return (
    <AppShell title="Community" subtitle="Sustainability analytics across the network.">
      {/* Global totals */}
      {tLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total users" value={totals?.total_users ?? 0} icon={Users} />
          <StatCard label="Total trips" value={totals?.total_trips ?? 0} icon={RouteIcon} />
          <StatCard label="CO₂ tracked" value={Number(totals?.total_co2 ?? 0).toFixed(0)} unit="kg" icon={Activity} />
          <StatCard label="CO₂ saved" value={Number(totals?.total_saved ?? 0).toFixed(0)} unit="kg" icon={Leaf} accent="success" />
          <StatCard label="Distance" value={Number(totals?.total_distance ?? 0).toFixed(0)} unit="km" icon={Activity} />
          <StatCard label="Green points" value={totals?.total_green_points ?? 0} icon={Sparkles} accent="warning" />
        </div>
      )}

      {/* My comparison */}
      {comparison !== null && (
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">vs your area average</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You emit{" "}
                <span className={cn("font-semibold", comparison >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--destructive)]")}>
                  {Math.abs(comparison)}% {comparison >= 0 ? "less" : "more"}
                </span>{" "}
                CO₂ than the average user in {profile?.area ?? "your area"}.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <CompareTile label="Area avg" value={`${areaAvg.toFixed(1)} kg`} />
            <CompareTile label="City avg" value={`${Number(myCity?.avg_co2 ?? 0).toFixed(1)} kg`} />
            <CompareTile label="State avg" value={`${Number(myState?.avg_co2 ?? 0).toFixed(1)} kg`} />
          </div>
        </div>
      )}

      {/* Top areas chart */}
      <div className="mt-5 space-y-4">
        <ChartCard title="Top areas" description="Most green points">
          {aLoading ? <Skeleton className="h-44 w-full" /> : <RankBars rows={areas.slice(0, 8).map((r) => ({ name: r.area ?? "—", points: r.total_green_points ?? 0 }))} />}
        </ChartCard>
        <ChartCard title="Top cities" description="Most green points">
          {cLoading ? <Skeleton className="h-44 w-full" /> : <RankBars rows={cities.slice(0, 8).map((r) => ({ name: r.city ?? "—", points: r.total_green_points ?? 0 }))} />}
        </ChartCard>
        <ChartCard title="Top states" description="Most green points">
          {sLoading ? <Skeleton className="h-44 w-full" /> : <RankBars rows={states.slice(0, 8).map((r) => ({ name: r.state ?? "—", points: r.total_green_points ?? 0 }))} />}
        </ChartCard>

        {/* Heatmap (simple zoning until Mapbox token added) */}
        <ChartCard title="Sustainability heatmap" description="Area zones by CO₂ saved">
          {areas.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {areas.slice(0, 12).map((a) => {
                const saved = Number(a.avg_saved ?? 0);
                const zone = saved >= 5 ? "green" : saved >= 2 ? "yellow" : "red";
                const color = zone === "green" ? "bg-[color:var(--success)]" : zone === "yellow" ? "bg-[color:var(--warning)]" : "bg-[color:var(--destructive)]";
                return (
                  <li key={`${a.state}-${a.city}-${a.area}`} className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5">
                    <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.area}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{a.city}, {a.state} • {a.active_users} users</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary tabular-nums">{saved.toFixed(1)} kg</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">avg saved</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Map view coming in a later phase — zones below show CO₂ savings per area.
          </p>
        </ChartCard>
      </div>
    </AppShell>
  );
}

function CompareTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/60 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

function RankBars({ rows }: { rows: { name: string; points: number }[] }) {
  if (!rows.length) return <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p>;
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--color-border)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "var(--color-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }} />
          <Bar dataKey="points" radius={[0, 8, 8, 0]} fill="var(--color-primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
