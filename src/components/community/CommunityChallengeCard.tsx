import { Users } from "lucide-react";
import type { CommunityChallenge } from "@/hooks/use-community";

export function CommunityChallengeCard({ c }: { c: CommunityChallenge }) {
  const pct = Math.min(100, Math.round((Number(c.current_progress) / Number(c.target)) * 100));
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">{c.scope} goal</p>
          <h4 className="text-sm font-semibold mt-0.5 truncate">{c.title}</h4>
          {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
        </div>
        <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Users className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
          <span>{Number(c.current_progress).toLocaleString()} / {Number(c.target).toLocaleString()}</span>
          <span className="text-primary font-medium">+{c.reward} pts</span>
        </div>
      </div>
    </div>
  );
}
