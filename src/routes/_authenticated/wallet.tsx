import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { WalletCard } from "@/components/cards/WalletCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useWallet } from "@/hooks/use-gamification";
import { ArrowDown, ArrowUp, Wallet as WalletIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — EcoRewards AI" }] }),
  component: WalletPage,
});

const SOURCE_LABEL: Record<string, string> = {
  trip: "Trip reward", challenge: "Challenge", badge: "Badge unlocked",
  referral: "Referral", bonus: "Bonus", manual: "Adjustment", social: "Social",
};

function WalletPage() {
  const { wallet, txs, loading } = useWallet();

  return (
    <AppShell title="Wallet" subtitle="Your Green Points history.">
      {loading ? <Skeleton className="h-36 rounded-2xl" /> : <WalletCard wallet={wallet} />}

      <h2 className="mt-6 mb-3 text-sm font-semibold">Transactions</h2>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : txs.length === 0 ? (
        <EmptyState icon={WalletIcon} title="No transactions yet" description="Log a trip to earn your first points." />
      ) : (
        <ul className="space-y-2">
          {txs.map((t) => {
            const positive = t.amount > 0;
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-[var(--shadow-card)]">
                <div className={
                  positive
                    ? "rounded-lg bg-primary/10 p-2 text-primary"
                    : "rounded-lg bg-destructive/10 p-2 text-destructive"
                }>
                  {positive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description ?? SOURCE_LABEL[t.source]}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {SOURCE_LABEL[t.source]} · {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
                <p className={`text-sm font-semibold tabular-nums ${positive ? "text-primary" : "text-destructive"}`}>
                  {positive ? "+" : ""}{t.amount}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
