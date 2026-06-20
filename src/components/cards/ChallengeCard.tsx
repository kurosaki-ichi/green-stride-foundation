import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

export function ChallengeCard({
  title,
  description,
  progress,
  reward,
}: {
  title: string;
  description?: string;
  progress: number;
  reward: number;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-accent p-2.5 text-accent-foreground">
          <Target className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold leading-tight">{title}</h4>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          +{reward}
        </span>
      </div>
      <div className="mt-3">
        <Progress value={progress} className="h-2" />
        <p className="mt-1 text-[11px] text-muted-foreground">{progress}% complete</p>
      </div>
    </div>
  );
}
