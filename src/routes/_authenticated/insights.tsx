import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SustainabilityScoreCard } from "@/components/ai/SustainabilityScoreCard";
import { ForecastCard } from "@/components/ai/ForecastCard";
import { RecommendationsList } from "@/components/ai/RecommendationsList";
import { GoalPlanner } from "@/components/ai/GoalPlanner";
import { useSustainabilityScore } from "@/hooks/use-ai";
import { useProfile } from "@/hooks/use-profile";
import { useStats } from "@/hooks/use-stats";
import { useAreaStats, useCityStats } from "@/hooks/use-rankings";
import { Sparkles, TrendingDown, Award, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights — EcoRewards AI" },
      { name: "description", content: "AI-powered sustainability insights, forecasts, score breakdown, and personalized goals." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { score } = useSustainabilityScore();
  const { profile } = useProfile();
  const { stats } = useStats();
  const { rows: areaRows } = useAreaStats();
  const { rows: cityRows } = useCityStats();

  const myArea = areaRows.find((a) => a.area === profile?.area && a.city === profile?.city);
  const myCity = cityRows.find((c) => c.city === profile?.city);

  const userCo2 = Number(stats?.total_co2 ?? 0);
  const areaCo2 = Number(myArea?.avg_co2 ?? 0);
  const cityCo2 = Number(myCity?.avg_co2 ?? 0);
  const vsArea = areaCo2 > 0 ? Math.round(((areaCo2 - userCo2) / areaCo2) * 100) : 0;
  const vsCity = cityCo2 > 0 ? Math.round(((cityCo2 - userCo2) / cityCo2) * 100) : 0;

  return (
    <AppShell title="Insights" subtitle="What your data reveals." right={
      <Link to="/ai-coach" className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" /> Ask coach
      </Link>
    }>
      <div className="space-y-4">
        <SustainabilityScoreCard s={score} />

        <ForecastCard />

        <section>
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Community comparison</h3>
          <div className="grid grid-cols-2 gap-3">
            <Compare icon={Users} label="vs your area" value={vsArea} />
            <Compare icon={Users} label="vs your city" value={vsCity} />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Suggested actions</h3>
            <Link to="/ai-coach" className="text-xs font-medium text-primary">Ask why →</Link>
          </div>
          <RecommendationsList />
        </section>

        <section>
          <GoalPlanner />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <MiniInsight icon={TrendingDown} title="Biggest source" value="Transport" hint="Largest share of emissions" />
          <MiniInsight icon={Award} title="Best habit" value={`${Number(stats?.total_saved ?? 0).toFixed(0)} kg saved`} hint="Total avoided" />
        </section>
      </div>
    </AppShell>
  );
}

function Compare({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  const positive = value > 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /><span className="text-[11px] uppercase tracking-wide">{label}</span></div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${positive ? "text-success" : "text-warning"}`}>
        {positive ? "-" : "+"}{Math.abs(value)}%
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{positive ? "less than average" : "more than average"}</p>
    </div>
  );
}

function MiniInsight({ icon: Icon, title, value, hint }: { icon: typeof Users; title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /><span className="text-[11px] uppercase tracking-wide">{title}</span></div>
      <p className="mt-2 text-base font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  );
}
