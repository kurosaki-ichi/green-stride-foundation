import { Sparkles, TrendingUp } from "lucide-react";
import type { SustainabilityScore } from "@/hooks/use-ai";

export function SustainabilityScoreCard({ s }: { s: SustainabilityScore | null }) {
  const score = s?.score ?? 0;
  const factors = s ? [
    { k: "Transport", v: s.transport },
    { k: "Challenges", v: s.challenges },
    { k: "Community", v: s.community },
    { k: "Trust", v: s.trust },
    { k: "Consistency", v: s.consistency },
  ] : [];
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-primary/10 p-1.5 text-primary"><Sparkles className="h-4 w-4" /></span>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Sustainability score</p>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-5xl font-bold tabular-nums text-primary">{score}</span>
        <span className="text-sm text-muted-foreground mb-1.5">/ 100</span>
      </div>
      <div className="mt-4 space-y-2">
        {factors.map((f) => (
          <div key={f.k}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">{f.k}</span>
              <span className="font-medium tabular-nums">{f.v}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${f.v}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> Updated continuously from your activity.
      </p>
    </div>
  );
}
