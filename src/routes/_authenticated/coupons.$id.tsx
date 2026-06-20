import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { CouponQR } from "@/components/CouponQR";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Copy, CheckCircle2, Clock, XCircle, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/hooks/use-rewards";

export const Route = createFileRoute("/_authenticated/coupons/$id")({
  head: () => ({ meta: [{ title: "Coupon — EcoRewards AI" }] }),
  component: CouponDetail,
});

function CouponDetail() {
  const { id } = useParams({ from: "/_authenticated/coupons/$id" });
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("coupons")
      .select("*, rewards(title,brand,image_url,terms,validity_days)")
      .eq("id", id)
      .maybeSingle();
    setCoupon((data ?? null) as Coupon | null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function markUsed() {
    if (!coupon) return;
    setMarking(true);
    const { error } = await supabase
      .from("coupons")
      .update({ status: "used", used_at: new Date().toISOString() })
      .eq("id", coupon.id);
    setMarking(false);
    if (error) return toast.error(error.message);
    toast.success("Marked as used");
    load();
  }

  if (loading) {
    return (
      <AppShell title="Coupon">
        <Skeleton className="h-72 w-full rounded-2xl" />
      </AppShell>
    );
  }

  if (!coupon) {
    return (
      <AppShell title="Coupon">
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Coupon not found.
        </p>
        <Link to="/coupons" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to coupons
        </Link>
      </AppShell>
    );
  }

  const StatusIcon = coupon.status === "active" ? Clock : coupon.status === "used" ? CheckCircle2 : XCircle;
  const expired = new Date(coupon.expires_at).getTime() < Date.now();

  return (
    <AppShell title="Coupon">
      <Link to="/coupons" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[color:var(--success)] p-5 text-primary-foreground shadow-[var(--shadow-card)]">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{coupon.rewards?.brand}</p>
        <h2 className="mt-1 text-xl font-semibold">{coupon.rewards?.title}</h2>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className={cn("inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 capitalize backdrop-blur")}>
            <StatusIcon className="h-3 w-3" /> {coupon.status}
          </span>
          <span className="opacity-80">
            {coupon.status === "used"
              ? `Used ${new Date(coupon.used_at ?? coupon.created_at).toLocaleDateString()}`
              : `Expires ${new Date(coupon.expires_at).toLocaleDateString()}`}
          </span>
        </div>
      </div>

      {coupon.status === "active" && !expired ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
          <CouponQR value={coupon.qr_payload} />
          <p className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground">Show at counter</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(coupon.code);
              toast.success("Code copied");
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 font-mono text-lg font-bold tracking-widest"
          >
            {coupon.code} <Copy className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <Ticket className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold">
            {coupon.status === "used" ? "Already redeemed" : "Coupon expired"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Code: <span className="font-mono">{coupon.code}</span></p>
        </div>
      )}

      {coupon.rewards && "terms" in coupon.rewards && (coupon.rewards as any).terms && (
        <div className="mt-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Terms</p>
          <p className="mt-1 text-xs text-muted-foreground">{(coupon.rewards as any).terms}</p>
        </div>
      )}

      {coupon.status === "active" && !expired && (
        <Button onClick={markUsed} disabled={marking} variant="outline" className="mt-4 h-11 w-full rounded-xl">
          {marking ? "Marking…" : "Mark as used"}
        </Button>
      )}
    </AppShell>
  );
}
