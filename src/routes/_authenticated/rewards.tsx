import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { WalletCard } from "@/components/cards/WalletCard";
import { RewardCard } from "@/components/cards/RewardCard";
import { TierCard } from "@/components/cards/TierCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useWallet } from "@/hooks/use-gamification";
import { useRewardsCatalog, useMyTier, spendPoints, type Reward } from "@/hooks/use-rewards";
import { Search, Sparkles, Ticket, ChevronRight, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards — EcoRewards AI" }] }),
  component: RewardsPage,
});

function RewardsPage() {
  const navigate = useNavigate();
  const { wallet, loading: wLoading, refresh: refreshWallet } = useWallet();
  const { rewards, categories, loading, refresh } = useRewardsCatalog();
  const tier = useMyTier(wallet?.lifetime_earned ?? 0);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<"recommended" | "low" | "high">("recommended");
  const [selected, setSelected] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const filtered = useMemo(() => {
    let r = rewards;
    if (cat !== "all") r = r.filter((x) => x.reward_categories?.slug === cat);
    if (q.trim()) {
      const needle = q.toLowerCase();
      r = r.filter((x) => x.title.toLowerCase().includes(needle) || x.brand.toLowerCase().includes(needle));
    }
    if (sort === "low") r = [...r].sort((a, b) => a.points_cost - b.points_cost);
    if (sort === "high") r = [...r].sort((a, b) => b.points_cost - a.points_cost);
    return r;
  }, [rewards, q, cat, sort]);

  const trending = useMemo(() => rewards.filter((r) => r.trending).slice(0, 5), [rewards]);
  const recommended = useMemo(() => rewards.filter((r) => r.recommended).slice(0, 5), [rewards]);

  async function confirmRedeem() {
    if (!selected) return;
    setRedeeming(true);
    try {
      const res = await spendPoints(selected.id);
      toast.success(`Redeemed for ${res.points_spent} pts`);
      setSelected(null);
      await Promise.all([refresh(), refreshWallet()]);
      navigate({ to: "/coupons/$id", params: { id: res.coupon_id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not redeem");
    } finally {
      setRedeeming(false);
    }
  }

  const balance = wallet?.balance ?? 0;

  return (
    <AppShell title="Rewards" subtitle="Spend Green Points on real perks.">
      {wLoading ? <Skeleton className="h-36 rounded-2xl" /> : <WalletCard wallet={wallet} />}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/coupons" className="rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 p-1.5 text-primary"><Ticket className="h-4 w-4" /></span>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">My coupons</p>
          </div>
          <p className="mt-2 text-xs font-medium text-foreground">View wallet of coupons <ChevronRight className="ml-0.5 inline h-3 w-3" /></p>
        </Link>
        <Link to="/membership" className="rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[color:var(--warning)]/15 p-1.5 text-[color:var(--warning)]"><Star className="h-4 w-4" /></span>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Membership</p>
          </div>
          <p className="mt-2 text-xs font-medium text-foreground">
            {tier?.current?.name ?? "Bronze"} tier <ChevronRight className="ml-0.5 inline h-3 w-3" />
          </p>
        </Link>
      </div>

      {/* Search + filters */}
      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand or reward"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={cat === c.slug} onClick={() => setCat(c.slug)}>{c.name}</Chip>
          ))}
        </div>
        <div className="flex gap-2 text-[11px]">
          {(["recommended", "low", "high"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "rounded-full border px-3 py-1 font-medium transition",
                sort === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              {s === "recommended" ? "Recommended" : s === "low" ? "Lowest cost" : "Highest cost"}
            </button>
          ))}
        </div>
      </div>

      {/* Trending strip */}
      {trending.length > 0 && cat === "all" && !q && (
        <section className="mt-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Flame className="h-4 w-4 text-[color:var(--warning)]" /> Trending now
          </h2>
          <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {trending.map((r) => (
              <div key={r.id} className="w-60 shrink-0 snap-start">
                <RewardCard
                  title={r.title} brand={r.brand} description={r.description}
                  cost={r.points_cost} balance={balance}
                  trending={r.trending} featured={r.featured} recommended={r.recommended}
                  remainingStock={r.reward_inventory?.remaining_stock ?? null}
                  imageUrl={r.image_url} categoryName={r.reward_categories?.name}
                  onClick={() => setSelected(r)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended */}
      {recommended.length > 0 && cat === "all" && !q && (
        <section className="mt-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Recommended for you
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {recommended.slice(0, 4).map((r) => (
              <RewardCard
                key={r.id} title={r.title} brand={r.brand} description={r.description}
                cost={r.points_cost} balance={balance}
                trending={r.trending} featured={r.featured} recommended={r.recommended}
                remainingStock={r.reward_inventory?.remaining_stock ?? null}
                imageUrl={r.image_url} categoryName={r.reward_categories?.name}
                onClick={() => setSelected(r)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All / filtered */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">
          {cat === "all" && !q ? "All rewards" : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No rewards match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((r) => (
              <RewardCard
                key={r.id} title={r.title} brand={r.brand} description={r.description}
                cost={r.points_cost} balance={balance}
                trending={r.trending} featured={r.featured} recommended={r.recommended}
                remainingStock={r.reward_inventory?.remaining_stock ?? null}
                imageUrl={r.image_url} categoryName={r.reward_categories?.name}
                onClick={() => setSelected(r)}
              />
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Demo rewards for prototype — coupons issued are simulated.
      </p>

      {/* Redeem dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left">{selected.title}</DialogTitle>
                <DialogDescription className="text-left">
                  <span className="font-medium text-foreground">{selected.brand}</span>
                  {selected.description ? ` · ${selected.description}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                  <span>Cost</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> {selected.points_cost.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                  <span>Your balance</span>
                  <span className="font-semibold tabular-nums">{balance.toLocaleString()} pts</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                  <span>Valid for</span>
                  <span className="font-semibold">{selected.validity_days} days</span>
                </div>
                {selected.terms && (
                  <p className="rounded-xl border border-border p-3 text-[11px] text-muted-foreground">{selected.terms}</p>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Cancel</Button>
                <Button
                  onClick={confirmRedeem}
                  disabled={redeeming || balance < selected.points_cost}
                  className="rounded-xl"
                >
                  {redeeming ? "Redeeming…" : balance < selected.points_cost ? "Not enough points" : "Confirm redeem"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}
