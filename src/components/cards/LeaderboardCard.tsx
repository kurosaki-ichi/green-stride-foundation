import { cn } from "@/lib/utils";

export function LeaderboardCard({
  rank,
  name,
  meta,
  points,
  highlight,
}: {
  rank: number;
  name: string;
  meta?: string;
  points: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-transparent bg-card p-3 shadow-[var(--shadow-card)]",
        highlight && "border-primary/30 bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold",
          rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-primary">{points.toLocaleString()}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">points</p>
      </div>
    </div>
  );
}
