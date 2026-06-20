import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RewardCard } from "@/components/cards/RewardCard";
import { ChallengeCard } from "@/components/cards/ChallengeCard";

const rewards = [
  { title: "₹100 off coffee", partner: "Blue Tokai", cost: 500, description: "Use at any outlet" },
  { title: "Free metro ride", partner: "BMRCL", cost: 300, description: "Single journey, any line" },
  { title: "20% off shoes", partner: "Decathlon", cost: 1200, description: "Running & cycling gear" },
  { title: "Movie ticket", partner: "PVR", cost: 1500, description: "Weekday show" },
];

const challenges = [
  { title: "Walk 5 km today", reward: 50, progress: 60, description: "Earn extra points by skipping the cab." },
  { title: "Take public transport 3×", reward: 120, progress: 33 },
];

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards — EcoRewards AI" }] }),
  component: () => (
    <AppShell title="Rewards" subtitle="Redeem your green points.">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-[color:var(--success)] p-5 text-primary-foreground shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase tracking-wide opacity-80">Balance</p>
        <p className="mt-1 text-4xl font-bold">1,240 <span className="text-base font-medium opacity-90">points</span></p>
        <p className="mt-1 text-sm opacity-90">+86 earned today</p>
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-foreground">Active challenges</h2>
      <div className="space-y-3">
        {challenges.map((c) => <ChallengeCard key={c.title} {...c} />)}
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-foreground">Marketplace</h2>
      <div className="grid grid-cols-1 gap-3">
        {rewards.map((r) => <RewardCard key={r.title} {...r} />)}
      </div>
    </AppShell>
  ),
});
