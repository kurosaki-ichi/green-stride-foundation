import { Progress } from "@/components/ui/progress";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ChallengeWithProgress } from "@/hooks/use-gamification";

const TYPE_LABEL: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", seasonal: "Seasonal",
};
const METRIC_UNIT: Record<string, string> = {
  distance_walk: "km", distance_cycle: "km", distance_total: "km",
  trips_public: "trips", trips_total: "trips", co2_saved: "kg",
};

export function ChallengeCard({ challenge }: { challenge: ChallengeWithProgress }) {
  const Icon = (Icons as any)[challenge.icon ?? "Target"] ?? Icons.Target;
  const target = Number(challenge.target);
  const progress = Math.min(target, Number(challenge.progress));
  const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
  const unit = METRIC_UNIT[challenge.metric] ?? "";
  const done = challenge.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition",
        done && "ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "rounded-xl p-2.5",
          done ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {TYPE_LABEL[challenge.type]}
            </span>
            {done && (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                Completed
              </span>
            )}
          </div>
          <h4 className="mt-1 text-sm font-semibold leading-tight">{challenge.title}</h4>
          {challenge.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{challenge.description}</p>
          )}
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          +{challenge.reward}
        </span>
      </div>
      <div className="mt-3">
        <Progress value={pct} className="h-2" />
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span className="tabular-nums">
            {progress.toFixed(unit === "kg" ? 1 : 0)} / {target} {unit}
          </span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      </div>
    </motion.div>
  );
}
