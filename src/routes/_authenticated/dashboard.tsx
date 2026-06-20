import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/cards/ChartCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Leaf, Sparkles, TrendingDown, Trophy, ShieldCheck, Activity, Moon, Sun, Plus,
  Route as RouteIcon, Flame, Target as TargetIcon, ChevronRight,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { useProfile } from "@/hooks/use-profile";
import { useStats, useWeeklyTrend, useTransportBreakdown } from "@/hooks/use-stats";
import { useMyRanks, useRankHistory } from "@/hooks/use-rankings";
import { useWallet, useStreak, useChallenges } from "@/hooks/use-gamification";
import { useRewardsCatalog, useMyTier, useRedemptions } from "@/hooks/use-rewards";
import { RankWidget } from "@/components/cards/RankWidget";
import { TrustScoreCard } from "@/components/cards/TrustScoreCard";
import { LocationInsightsCard } from "@/components/cards/LocationInsightsCard";
import { TierCard } from "@/components/cards/TierCard";
import { RewardCard } from "@/components/cards/RewardCard";
import { useAreaStats } from "@/hooks/use-rankings";
import { Progress } from "@/components/ui/progress";

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
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { profile, loading: pLoading } = useProfile();
  const { stats, carbon, loading: sLoading } = useStats();
  const { data: weekly, loading: wLoading } = useWeeklyTrend();
  const { data: transport, loading: tLoading } = useTransportBreakdown();
  const { row: myRank, loading: rLoading } = useMyRanks(profile?.id);
  const { rows: history } = useRankHistory(profile?.id, "global");
  const { wallet } = useWallet();
  const { streak } = useStreak();
  const { items: challenges } = useChallenges();
  const { rows: areaRows } = useAreaStats();
  const { rewards } = useRewardsCatalog();
  const { items: redemptions } = useRedemptions();
  const tier = useMyTier(wallet?.lifetime_earned ?? 0);
  const featuredRewards = rewards.filter((r) => r.featured || r.recommended).slice(0, 4);
  const lastRedemption = redemptions[0];
  const nextChallenge = challenges.find((c) => !c.completed);
  const myArea = areaRows.find(
    (a) => a.area === profile?.area && a.city === profile?.city && a.state === profile?.state,
  );

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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link to="/wallet" className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 p-1.5 text-primary"><Sparkles className="h-4 w-4" /></span>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Wallet</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{(wallet?.balance ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">+{wallet?.month_earned ?? 0} this month</p>
        </Link>
        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[color:var(--warning)]/15 p-1.5 text-[color:var(--warning)]"><Flame className="h-4 w-4" /></span>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Streak</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{streak?.current_streak ?? 0} <span className="text-xs font-medium text-muted-foreground">days</span></p>
          <p className="text-[11px] text-muted-foreground">Best: {streak?.longest_streak ?? 0}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <TrustScoreCard score={profile?.trust_score ?? 50} verified={!!profile?.location_verified} />
        <LocationInsightsCard
          area={profile?.area}
          city={profile?.city}
          userAvg={Number(stats?.total_co2 ?? 0)}
          areaAvg={Number(myArea?.avg_co2 ?? 0)}
          areaRank={myArea?.rank ?? null}
        />
      </div>

      {tier && (
        <div className="mt-3">
          <Link to="/membership" className="block">
            <TierCard current={tier.current} next={tier.next} progress={tier.progress} remaining={tier.remaining} compact />
          </Link>
        </div>
      )}

      {lastRedemption && (
        <Link
          to="/coupons"
          className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
        >
          <span className="rounded-lg bg-primary/10 p-2 text-primary"><Sparkles className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Recent redemption</p>
            <p className="truncate text-sm font-semibold">{lastRedemption.rewards?.title ?? "Reward"}</p>
          </div>
          <span className="text-xs font-semibold text-destructive">−{lastRedemption.points_spent}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      {featuredRewards.length > 0 && (
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Available rewards</h2>
            <Link to="/rewards" className="text-xs font-medium text-primary">See all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredRewards.map((r) => (
              <RewardCard
                key={r.id} title={r.title} brand={r.brand} description={r.description}
                cost={r.points_cost} balance={wallet?.balance ?? 0}
                trending={r.trending} featured={r.featured} recommended={r.recommended}
                remainingStock={r.reward_inventory?.remaining_stock ?? null}
                imageUrl={r.image_url} categoryName={r.reward_categories?.name}
                onClick={() => navigate({ to: "/rewards" })}
              />
            ))}
          </div>
        </section>
      )}

      {nextChallenge && (
        <Link to="/challenges" className="mt-3 block rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-accent p-2 text-accent-foreground"><TargetIcon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Active challenge</p>
              <p className="truncate text-sm font-semibold">{nextChallenge.title}</p>
            </div>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">+{nextChallenge.reward}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <Progress
            value={Math.min(100, Math.round((Number(nextChallenge.progress) / Number(nextChallenge.target)) * 100))}
            className="mt-3 h-2"
          />
        </Link>
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

        <RankWidget row={myRank} loading={rLoading} />

        {history.length >= 2 && (
          <ChartCard title="Rank history" description="Your global rank over recent weeks">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history.map((h) => ({ wk: h.week_start.slice(5), rank: h.rank }))} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="wk" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis reversed tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }} />
                  <Line type="monotone" dataKey="rank" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-primary)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        <Link
          to="/analytics"
          className="block rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Community analytics</h3>
              <p className="text-xs text-muted-foreground">Compare your impact across areas, cities & states.</p>
            </div>
            <span className="text-xs font-medium text-primary">View →</span>
          </div>
        </Link>
      </div>
    </AppShell>
  );
}
