import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/cards/ChartCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Leaf, Sparkles, TrendingDown, Trophy, ShieldCheck, Activity, Moon, Sun, Plus, Route as RouteIcon,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { useProfile } from "@/hooks/use-profile";
import { useStats, useWeeklyTrend, useTransportBreakdown } from "@/hooks/use-stats";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EcoRewards AI" }] }),
  component: Dashboard,
});

const PALETTE = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
  "var(--color-destructive)",
  "var(--color-accent)",
];

function Dashboard() {
  const { theme, toggle } = useTheme();
  const { profile, loading: pLoading } = useProfile();
  const { stats, carbon, loading: sLoading } = useStats();
  const { data: weekly, loading: wLoading } = useWeeklyTrend();
  const { data: transport, loading: tLoading } = useTransportBreakdown();

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <AppShell
      title={`Hi ${firstName} 👋`}
      subtitle="Here's your impact today."
      right={
        <Button variant="ghost" size="icon" onClick={toggle} className="rounded-xl">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      }
    >
      {sLoading || pLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Daily CO₂" value={carbon.daily.toFixed(1)} unit="kg" icon={Leaf} />
          <StatCard label="Weekly CO₂" value={carbon.weekly.toFixed(1)} unit="kg" icon={TrendingDown} accent="success" />
          <StatCard label="Monthly CO₂" value={carbon.monthly.toFixed(1)} unit="kg" icon={Activity} />
          <StatCard label="Total saved" value={carbon.totalSaved.toFixed(1)} unit="kg" icon={Sparkles} accent="success" />
          <StatCard label="Trips logged" value={stats?.total_trips ?? 0} icon={RouteIcon} />
          <StatCard label="Distance" value={Number(stats?.total_distance ?? 0).toFixed(0)} unit="km" icon={Activity} />
          <StatCard label="Green Points" value={profile?.green_points ?? 0} icon={Sparkles} accent="warning" />
          <StatCard label="Trust Score" value={profile?.trust_score ?? 50} icon={ShieldCheck} accent="success" />
        </div>
      )}

      <div className="mt-5 space-y-4">
        <ChartCard title="Weekly trend" description="CO₂ emitted, last 7 days">
          {wLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : weekly.every((d) => d.co2 === 0) ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Log a trip to see your trend.</p>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }} />
                  <Line type="monotone" dataKey="co2" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-primary)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Transport breakdown" description="Share of your trips, last 30 days">
          {tLoading ? (
            <Skeleton className="h-36 w-full" />
          ) : transport.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No trips yet.</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-36 w-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={transport} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2}>
                      {transport.map((t, i) => <Cell key={t.mode} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-2">
                {transport.map((t, i) => (
                  <li key={t.mode} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="flex-1 text-foreground">{t.name}</span>
                    <span className="text-muted-foreground">{t.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartCard>

        {stats?.total_trips === 0 && (
          <EmptyState
            icon={Plus}
            title="Log your first trip"
            description="Your dashboard fills in once you log activity."
            action={
              <Link to="/tracking">
                <Button className="rounded-xl">Log a trip</Button>
              </Link>
            }
          />
        )}

        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Rank {profile?.current_rank ? `#${profile.current_rank}` : "— coming soon"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Leaderboards launch once enough trips are logged in your area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
