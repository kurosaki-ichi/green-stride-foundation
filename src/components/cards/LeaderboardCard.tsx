import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type RankTrend = "up" | "down" | "same" | null;

export function LeaderboardCard({
  rank,
  name,
  meta,
  points,
  saved,
  trustScore,
  trend,
  trendDelta,
  avatar,
  highlight,
}: {
  rank: number;
  name: string;
  meta?: string;
  points: number;
  saved?: number;
  trustScore?: number;
  trend?: RankTrend;
  trendDelta?: number;
  avatar?: string | null;
  highlight?: boolean;
}) {
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-transparent bg-card p-3 shadow-[var(--shadow-card)] transition",
        highlight && "border-primary/40 bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums",
          rank === 1 ? "bg-amber-400/20 text-amber-600 dark:text-amber-400" :
          rank === 2 ? "bg-slate-300/30 text-slate-700 dark:text-slate-200" :
          rank === 3 ? "bg-orange-400/20 text-orange-600 dark:text-orange-400" :
          "bg-muted text-foreground",
        )}
      >
        {rank}
      </div>
      {avatar ? (
        <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials || "—"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <div className="flex items-center gap-2">
          {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
          {typeof trustScore === "number" && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Trust {trustScore}
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-primary tabular-nums">{points.toLocaleString()}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {typeof saved === "number" ? `${saved.toFixed(1)} kg saved` : "points"}
        </p>
      </div>
      {trend && (
        <div
          className={cn(
            "flex w-10 items-center justify-end gap-0.5 text-xs font-medium tabular-nums",
            trend === "up" && "text-[color:var(--success)]",
            trend === "down" && "text-[color:var(--destructive)]",
            trend === "same" && "text-muted-foreground",
          )}
        >
          {trend === "up" && <ArrowUp className="h-3 w-3" />}
          {trend === "down" && <ArrowDown className="h-3 w-3" />}
          {trend === "same" && <Minus className="h-3 w-3" />}
          {trend !== "same" && trendDelta != null && <span>{Math.abs(trendDelta)}</span>}
        </div>
      )}
    </div>
  );
}
