import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ChallengeCard } from "@/components/cards/ChallengeCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChallenges } from "@/hooks/use-gamification";
import { Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({ meta: [{ title: "Challenges — EcoRewards AI" }] }),
  component: ChallengesPage,
});

function ChallengesPage() {
  const { items, loading } = useChallenges();
  const [tab, setTab] = useState("active");

  const groups = useMemo(() => {
    const active = items.filter((c) => !c.completed);
    const completed = items.filter((c) => c.completed);
    const recommended = active.slice().sort((a, b) => b.reward - a.reward).slice(0, 3);
    return { active, completed, recommended };
  }, [items]);

  return (
    <AppShell title="Challenges" subtitle="Complete missions, earn Green Points.">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Active" value={groups.active.length} />
        <Stat label="Done" value={groups.completed.length} />
        <Stat label="Points avail." value={groups.active.reduce((s, c) => s + c.reward, 0)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 rounded-xl">
          <TabsTrigger value="active" className="rounded-lg text-xs">Active</TabsTrigger>
          <TabsTrigger value="recommended" className="rounded-lg text-xs">For you</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-xs">Done</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : groups.active.length === 0 ? (
            <EmptyState icon={Target} title="No active challenges" description="You've crushed them all. Check back tomorrow." />
          ) : (
            groups.active.map((c) => <ChallengeCard key={c.id} challenge={c} />)
          )}
        </TabsContent>

        <TabsContent value="recommended" className="mt-4 space-y-3">
          {loading ? <Skeleton className="h-24 rounded-2xl" /> :
            groups.recommended.length === 0 ? (
              <EmptyState icon={Target} title="Nothing recommended yet" description="Log a few trips to unlock tailored missions." />
            ) : groups.recommended.map((c) => <ChallengeCard key={c.id} challenge={c} />)
          }
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-3">
          {loading ? <Skeleton className="h-24 rounded-2xl" /> :
            groups.completed.length === 0 ? (
              <EmptyState icon={Target} title="No completions yet" description="Finish a challenge to see it here." />
            ) : groups.completed.map((c) => <ChallengeCard key={c.id} challenge={c} />)
          }
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card p-3 text-center shadow-[var(--shadow-card)]">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
