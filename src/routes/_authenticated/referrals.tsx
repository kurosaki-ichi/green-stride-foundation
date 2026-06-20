import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useReferrals } from "@/hooks/use-gamification";
import { Copy, Share2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Refer friends — EcoRewards AI" }] }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const { code, items, earned, loading, generateLink } = useReferrals();
  const completed = items.filter((i) => i.status === "completed");
  const url = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${code}` : "";

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  async function share() {
    if (!url) return;
    if (navigator.share) {
      try { await navigator.share({ title: "Join EcoRewards", url }); } catch { /* cancelled */ }
    } else { copy(); }
  }

  return (
    <AppShell title="Refer friends" subtitle="Earn 100 pts per successful referral.">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-[color:var(--success)] p-5 text-primary-foreground shadow-[var(--shadow-card)]">
        <p className="text-xs uppercase opacity-80">Your invite link</p>
        <div className="mt-2 flex gap-2">
          <Input readOnly value={url} className="h-10 rounded-xl border-0 bg-white/15 text-xs text-primary-foreground placeholder:text-primary-foreground/60" />
          <Button onClick={copy} size="icon" variant="secondary" className="h-10 w-10 rounded-xl"><Copy className="h-4 w-4" /></Button>
        </div>
        <Button onClick={share} variant="secondary" className="mt-3 h-10 w-full rounded-xl">
          <Share2 className="mr-2 h-4 w-4" /> Share link
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Invited" value={items.length} />
        <Stat label="Joined" value={completed.length} />
        <Stat label="Earned" value={earned} />
      </div>

      <div className="mt-4">
        <Button onClick={async () => { const c = await generateLink(); if (c) toast.success("New code generated"); }}
          variant="outline" className="h-10 w-full rounded-xl">
          <UserPlus className="mr-2 h-4 w-4" /> Generate new code
        </Button>
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold">Referral history</h2>
      {loading ? (
        <Skeleton className="h-20 rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState icon={Users} title="No referrals yet" description="Share your link to start earning." />
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-xl bg-card p-3 shadow-[var(--shadow-card)]">
              <div>
                <p className="font-mono text-sm font-semibold">{r.code}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-semibold ${r.status === "completed" ? "text-primary" : "text-muted-foreground"}`}>
                  {r.status === "completed" ? "Joined" : "Pending"}
                </p>
                {r.points_awarded > 0 && <p className="text-[11px] text-muted-foreground">+{r.points_awarded} pts</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card p-3 text-center shadow-[var(--shadow-card)]">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
