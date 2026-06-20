import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { Lock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const TIER_STYLES: Record<string, string> = {
  bronze:   "from-amber-700/20 to-amber-500/10 text-amber-600 ring-amber-500/30",
  silver:   "from-slate-400/20 to-slate-300/10 text-slate-500 ring-slate-400/30",
  gold:     "from-yellow-500/25 to-amber-400/10 text-yellow-600 ring-yellow-500/40",
  platinum: "from-indigo-500/25 to-purple-400/10 text-indigo-600 ring-indigo-500/40",
};

export function BadgeCard({
  badge, earned, earnedAt,
}: {
  badge: Tables<"badges">;
  earned: boolean;
  earnedAt?: string | null;
}) {
  const Icon = (Icons as any)[badge.icon ?? "Award"] ?? Icons.Award;
  const tier = badge.tier ?? "bronze";

  return (
    <div className={cn(
      "relative rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition",
      !earned && "opacity-60",
    )}>
      <div className={cn(
        "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ring-1",
        TIER_STYLES[tier],
      )}>
        {earned ? <Icon className="h-7 w-7" /> : <Lock className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-center text-sm font-semibold leading-tight">{badge.name}</p>
      <p className="mt-0.5 text-center text-[11px] text-muted-foreground line-clamp-2">{badge.description}</p>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px]">
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">+{badge.reward}</span>
        {earned && earnedAt && (
          <span className="text-muted-foreground">· {new Date(earnedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
