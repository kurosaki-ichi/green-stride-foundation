import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useCoupons } from "@/hooks/use-rewards";
import { Ticket, Sparkles, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coupons")({
  head: () => ({ meta: [{ title: "Coupons — EcoRewards AI" }] }),
  component: CouponsPage,
});

type Tab = "active" | "used" | "expired";

function CouponsPage() {
  const { coupons, loading } = useCoupons();
  const [tab, setTab] = useState<Tab>("active");

  const filtered = useMemo(() => coupons.filter((c) => c.status === tab), [coupons, tab]);
  const counts = useMemo(() => ({
    active: coupons.filter((c) => c.status === "active").length,
    used: coupons.filter((c) => c.status === "used").length,
    expired: coupons.filter((c) => c.status === "expired").length,
  }), [coupons]);

  return (
    <AppShell title="Coupons" subtitle="Your redeemed rewards.">
      <div className="flex gap-2">
        {(["active", "used", "expired"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-xs font-semibold capitalize transition",
              tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
            )}
          >
            {t} · {counts[t]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={`No ${tab} coupons`}
            description={tab === "active" ? "Redeem a reward to get your first coupon." : "Nothing here yet."}
          />
        ) : (
          filtered.map((c) => {
            const StatusIcon = c.status === "active" ? Clock : c.status === "used" ? CheckCircle2 : XCircle;
            const tone =
              c.status === "active" ? "text-primary"
              : c.status === "used" ? "text-[color:var(--success)]"
              : "text-muted-foreground";
            return (
              <Link
                key={c.id}
                to="/coupons/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Ticket className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {c.rewards?.brand ?? "Reward"}
                  </p>
                  <p className="truncate text-sm font-semibold">{c.rewards?.title ?? "Coupon"}</p>
                  <p className={cn("mt-0.5 flex items-center gap-1 text-[11px]", tone)}>
                    <StatusIcon className="h-3 w-3" />
                    {c.status === "active"
                      ? `Expires ${new Date(c.expires_at).toLocaleDateString()}`
                      : c.status === "used"
                      ? `Used ${new Date(c.used_at ?? c.created_at).toLocaleDateString()}`
                      : `Expired ${new Date(c.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })
        )}
      </div>

      <Link
        to="/rewards"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
      >
        <Sparkles className="h-4 w-4" /> Browse rewards
      </Link>
    </AppShell>
  );
}
