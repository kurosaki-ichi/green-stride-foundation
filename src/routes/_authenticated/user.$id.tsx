import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { usePublicProfile } from "@/hooks/use-phase9";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ChartCard } from "@/components/cards/ChartCard";
import { StatCard } from "@/components/cards/StatCard";
import {
  Activity, Award, Leaf, MapPin, ShieldCheck, Sparkles, Trophy,
  UserX, Calendar, Route as RouteIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_authenticated/user/$id")({
  head: () => ({ meta: [{ title: "Profile — EcoRewards AI" }] }),
  component: PublicProfilePage,
});

const TRANSPORT_COLORS: Record<string, string> = {
  walk: "#10B981", cycle: "#16A34A", metro: "#0EA5E9",
  bus: "#F59E0B", ev: "#84CC16", car: "#94A3B8",
};

function PublicProfilePage() {
  const { id } = useParams({ from: "/_authenticated/user/$id" });
  const { data, loading } = usePublicProfile(id);

  if (loading) {
    return (
      <AppShell title="Profile">
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell title="Profile">
        <EmptyState icon={UserX} title="User not found" description="This sustainability profile doesn't exist or is private." />
        <Link to="/leaderboard" className="block text-center text-sm text-primary mt-4">← Back to leaderboard</Link>
      </AppShell>
    );
  }

  const loc = data.location ?? {};
  const stats = data.stats ?? {};
  const transport = data.transport ?? {};
  const transportEntries = Object.entries(transport).filter(([, v]) => Number(v) > 0);
  const transportTotal = transportEntries.reduce((s, [, v]) => s + Number(v), 0) || 1;
  const transportData = transportEntries.map(([mode, v]) => ({
    name: mode,
    value: data.is_demo ? Number(v) : Math.round((Number(v) / transportTotal) * 100),
    fill: TRANSPORT_COLORS[mode] ?? "#94A3B8",
  }));

  return (
    <AppShell title="Profile" subtitle={data.is_demo ? "Demo sustainability profile" : "Public sustainability profile"}>
      {/* Header card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-4">
          {data.photo ? (
            <img src={data.photo} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/40" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary ring-2 ring-primary/40">
              {String(data.name ?? "?").split(" ").map((s: string) => s[0]).join("").slice(0,2)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{data.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <VerificationBadge tier={data.tier} size="sm" />
              {data.is_demo && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">DEMO</span>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[loc.area, loc.city, loc.state].filter(Boolean).join(" • ") || "Location unknown"}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Member since {new Date(data.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <HeroStat label="Eco Score" value={data.eco_score.toLocaleString()} tone="primary" />
          <HeroStat label="Trust" value={`${data.trust_score}`} tone="success" />
          <HeroStat label="Verified" value={`${data.verified_pct}%`} tone="info" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="Green Points" value={data.green_points?.toLocaleString() ?? 0} icon={Sparkles} accent="warning" />
        <StatCard label="CO₂ Saved" value={Number(stats.total_saved ?? 0).toFixed(1)} unit="kg" icon={Leaf} accent="success" />
        <StatCard label="Trips" value={stats.total_trips ?? 0} icon={RouteIcon} />
        <StatCard label="Distance" value={Number(stats.total_distance ?? 0).toFixed(0)} unit="km" icon={Activity} />
        <StatCard label="Challenges" value={stats.challenges ?? 0} icon={Trophy} />
        <StatCard label="Badges" value={stats.badges ?? 0} icon={Award} />
      </div>

      {transportData.length > 0 && (
        <ChartCard title="Transport breakdown" description={data.is_demo ? "Lifetime split" : "Last 30 days"}>
          <div className="flex items-center gap-4">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={transportData} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2}>
                    {transportData.map((t) => <Cell key={t.name} fill={t.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5">
              {transportData.map((t) => (
                <li key={t.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.fill }} />
                  <span className="flex-1 capitalize">{t.name}</span>
                  <span className="text-muted-foreground tabular-nums">{t.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      )}

      <ChartCard title="Verification" description="How this user's activity is verified">
        <div className="space-y-2.5">
          <Bar label="Account trust" value={data.trust_score} color="bg-emerald-500" />
          <Bar label="Activity verified" value={data.verified_pct} color="bg-sky-500" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            {data.location_verified ? "Location verified" : "Location unverified"}
          </div>
        </div>
      </ChartCard>

      {Array.isArray(data.badges) && data.badges.length > 0 && (
        <ChartCard title={`Badges (${data.badges.length})`}>
          <div className="flex flex-wrap gap-2">
            {data.badges.map((b: any) => (
              <span key={b.id} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {b.icon ?? "🏆"} {b.name}
              </span>
            ))}
          </div>
        </ChartCard>
      )}

      {Array.isArray(data.recent_activity) && data.recent_activity.length > 0 && (
        <ChartCard title="Recent achievements">
          <ul className="divide-y divide-border">
            {data.recent_activity.slice(0, 5).map((a: any, i: number) => (
              <li key={i} className="flex items-center gap-2 py-2">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span className="flex-1 truncate text-sm">{a.title}</span>
                <span className="text-xs font-semibold text-primary">+{a.points}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}

      <Link to="/leaderboard" className="block text-center text-sm text-primary mt-4">← Back to leaderboard</Link>
    </AppShell>
  );
}

function HeroStat({ label, value, tone }: { label: string; value: string; tone: "primary" | "success" | "info" }) {
  const toneCls =
    tone === "primary" ? "text-primary" :
    tone === "success" ? "text-emerald-600 dark:text-emerald-400" :
    "text-sky-600 dark:text-sky-400";
  return (
    <div className="rounded-xl bg-card/60 p-2">
      <p className={`text-lg font-bold tabular-nums ${toneCls}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
