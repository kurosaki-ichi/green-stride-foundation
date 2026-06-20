import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { WalletCard } from "@/components/cards/WalletCard";
import { ChallengeCard } from "@/components/cards/ChallengeCard";
import { RewardCard } from "@/components/cards/RewardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet, useChallenges } from "@/hooks/use-gamification";
import { ChevronRight, Lock } from "lucide-react";

const rewards = [
  { title: "₹100 off coffee",   partner: "Blue Tokai", cost: 500,  description: "Use at any outlet" },
  { title: "Free metro ride",   partner: "BMRCL",      cost: 300,  description: "Single journey, any line" },
  { title: "20% off gear",      partner: "Decathlon",  cost: 1200, description: "Running & cycling" },
  { title: "Movie ticket",      partner: "PVR",        cost: 1500, description: "Weekday show" },
];

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards — EcoRewards AI" }] }),
  component: RewardsPage,
});

function RewardsPage() {
  const { wallet, loading: wLoading } = useWallet();
  const { items, loading: cLoading } = useChallenges();
  const active = items.filter((c) => !c.completed).slice(0, 3);

  return (
    <AppShell title="Rewards" subtitle="Earn points. Redeem perks.">
      {wLoading ? <Skeleton className="h-36 rounded-2xl" /> : <WalletCard wallet={wallet} />}

      <Link to="/wallet" className="mt-3 flex items-center justify-between rounded-xl bg-card p-3 text-sm shadow-[var(--shadow-card)]">
        <span className="font-medium">View transactions</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Active challenges</h2>
        <Link to="/challenges" className="text-xs font-medium text-primary">See all →</Link>
      </div>
      <div className="mt-3 space-y-3">
        {cLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No active challenges right now.
          </p>
        ) : (
          active.map((c) => <ChallengeCard key={c.id} challenge={c} />)
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Marketplace</h2>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" /> Redemption coming soon
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3">
        {rewards.map((r) => <RewardCard key={r.title} {...r} />)}
      </div>
    </AppShell>
  );
}
