import { Award, Crown, Medal, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Tables } from "@/integrations/supabase/types";

const ICONS: Record<string, typeof Medal> = { medal: Medal, award: Award, trophy: Trophy, crown: Crown };

export function TierCard({
  current,
  next,
  progress,
  remaining,
  compact,
}: {
  current: Tables<"membership_tiers">;
  next: Tables<"membership_tiers"> | null;
  progress: number;
  remaining: number;
  compact?: boolean;
}) {
  const Icon = ICONS[current.icon ?? "medal"] ?? Medal;
  return (
    <div className="overflow-hidden rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ background: current.color ?? "var(--color-primary)" }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Membership</p>
          <p className="truncate text-lg font-semibold">{current.name}</p>
          <p className="text-[11px] text-muted-foreground">×{Number(current.multiplier).toFixed(2)} points multiplier</p>
        </div>
      </div>
      {next ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Next: {next.name}</span>
            <span className="font-semibold tabular-nums">{remaining.toLocaleString()} pts to go</span>
          </div>
          <Progress value={progress} className="mt-1.5 h-2" />
        </div>
      ) : (
        <p className="mt-3 text-[11px] font-medium text-primary">You're at the top tier 🎉</p>
      )}
      {!compact && Array.isArray(current.benefits) && (current.benefits as string[]).length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {(current.benefits as string[]).map((b) => (
            <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-primary" />
              <span className="flex-1 text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
