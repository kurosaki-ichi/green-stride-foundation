import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { WalletCard } from "@/components/cards/WalletCard";
import { ChartCard } from "@/components/cards/ChartCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useWallet } from "@/hooks/use-gamification";
import { useRedemptions } from "@/hooks/use-rewards";
import { ArrowDown, ArrowUp, Wallet as WalletIcon, Ticket, ChevronRight } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — EcoRewards AI" }] }),
  component: WalletPage,
});

const SOURCE_LABEL: Record<string, string> = {
  trip: "Trip reward", challenge: "Challenge", badge: "Badge unlocked",
  referral: "Referral", bonus: "Bonus", manual: "Adjustment", social: "Social",
  redemption: "Redemption",
};

function WalletPage() {
  const { wallet, txs, loading } = useWallet();
  const { items: redemptions, loading: rLoading } = useRedemptions();

  // Aggregate monthly earnings (last 6 months)
  const monthly = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(d.toISOString().slice(0, 7), { in: 0, out: 0 });
    }
    txs.forEach((t) => {
      const k = t.created_at.slice(0, 7);
      const row = map.get(k);
      if (!row) return;
      if (t.amount > 0) row.in += t.amount; else row.out += -t.amount;
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      month: new Date(k + "-01").toLocaleDateString(undefined, { month: "short" }),
      earned: v.in,
      spent: v.out,
    }));
  }, [txs]);

  return (
    <AppShell title="Wallet" subtitle="Your Green Points history.">
      {loading ? <Skeleton className="h-36 rounded-2xl" /> : <WalletCard wallet={wallet} />}

      <Link to="/coupons" className="mt-3 flex items-center justify-between rounded-xl bg-card p-3 text-sm shadow-[var(--shadow-card)]">
        <span className="flex items-center gap-2"><Ticket className="h-4 w-4 text-primary" /> My coupons</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <div className="mt-5">
        <ChartCard title="Monthly earnings" description="Earned vs spent, last 6 months">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }} />
                  <Bar dataKey="earned" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="spent" fill="var(--color-destructive)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {redemptions.length > 0 && (
        <>
          <h2 className="mt-6 mb-3 text-sm font-semibold">Recent redemptions</h2>
          <div className="space-y-2">
            {rLoading ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
              : redemptions.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-[var(--shadow-card)]">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><Ticket className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.rewards?.title ?? "Reward"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.rewards?.brand} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-destructive tabular-nums">−{r.points_spent}</p>
                </div>
              ))}
          </div>
        </>
      )}

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
                    {SOURCE_LABEL[t.source] ?? t.source} · {new Date(t.created_at).toLocaleString()}
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
