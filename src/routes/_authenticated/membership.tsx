import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TierCard } from "@/components/cards/TierCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/use-gamification";
import { useMyTier, useTiers } from "@/hooks/use-rewards";
import { Award, Crown, Medal, Trophy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Medal> = { medal: Medal, award: Award, trophy: Trophy, crown: Crown };

export const Route = createFileRoute("/_authenticated/membership")({
  head: () => ({ meta: [{ title: "Membership — EcoRewards AI" }] }),
  component: MembershipPage,
});

function MembershipPage() {
  const { wallet, loading } = useWallet();
  const tiers = useTiers();
  const tier = useMyTier(wallet?.lifetime_earned ?? 0);

  return (
    <AppShell title="Membership" subtitle="Earn more, unlock more.">
      {loading || !tier ? (
        <Skeleton className="h-36 rounded-2xl" />
      ) : (
        <TierCard current={tier.current} next={tier.next} progress={tier.progress} remaining={tier.remaining} />
      )}

      <h2 className="mt-6 mb-3 text-sm font-semibold">All tiers</h2>
      <div className="space-y-3">
        {tiers.map((t) => {
          const Icon = ICONS[t.icon ?? "medal"] ?? Medal;
          const isCurrent = tier?.current.id === t.id;
          const reached = (wallet?.lifetime_earned ?? 0) >= t.min_lifetime_points;
          return (
            <div
              key={t.id}
              className={cn(
                "rounded-2xl border-2 bg-card p-4 shadow-[var(--shadow-card)] transition",
                isCurrent ? "border-primary" : "border-transparent",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                  style={{ background: t.color ?? "var(--color-primary)" }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.min_lifetime_points.toLocaleString()}+ lifetime pts · ×{Number(t.multiplier).toFixed(2)} multiplier
                  </p>
                </div>
                {reached && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                    <Check className="h-3 w-3" /> Reached
                  </span>
                )}
              </div>
              {Array.isArray(t.benefits) && (t.benefits as string[]).length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {(t.benefits as string[]).map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs">
                      <Check className={cn("mt-0.5 h-3.5 w-3.5", reached ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex-1 text-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
