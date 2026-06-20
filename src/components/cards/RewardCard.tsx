import { Sparkles, Lock, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  brand: string;
  description?: string | null;
  cost: number;
  balance?: number;
  trending?: boolean;
  featured?: boolean;
  recommended?: boolean;
  remainingStock?: number | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  onClick?: () => void;
};

export function RewardCard({
  title, brand, description, cost, balance = 0,
  trending, featured, recommended, remainingStock, imageUrl, categoryName,
  onClick,
}: Props) {
  const affordable = balance >= cost;
  const lowStock = typeof remainingStock === "number" && remainingStock > 0 && remainingStock <= 10;
  const soldOut = typeof remainingStock === "number" && remainingStock <= 0;
  return (
    <button
      onClick={onClick}
      disabled={soldOut}
      className={cn(
        "group w-full overflow-hidden rounded-2xl bg-card text-left shadow-[var(--shadow-card)] transition disabled:opacity-60",
        !soldOut && "hover:shadow-[var(--shadow-card-hover)] active:scale-[.99]",
      )}
    >
      <div className="relative h-24 w-full bg-gradient-to-br from-primary/15 via-primary/5 to-accent">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-black tracking-tight text-primary/40">
            {brand.charAt(0)}
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-semibold text-background backdrop-blur">
              <Star className="h-2.5 w-2.5" /> Featured
            </span>
          )}
          {trending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--warning)] px-2 py-0.5 text-[10px] font-semibold text-white">
              <Flame className="h-2.5 w-2.5" /> Trending
            </span>
          )}
          {recommended && !featured && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              For you
            </span>
          )}
        </div>
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-xs font-semibold uppercase tracking-wide">
            Sold out
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{brand}</p>
          {categoryName && <span className="text-[10px] text-muted-foreground">· {categoryName}</span>}
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm font-semibold">{title}</p>
        {description && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{description}</p>}
        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> {cost.toLocaleString()} pts
          </span>
          {!affordable && !soldOut ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3" /> need {(cost - balance).toLocaleString()} more
            </span>
          ) : lowStock ? (
            <span className="text-[10px] font-medium text-[color:var(--warning)]">Only {remainingStock} left</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
