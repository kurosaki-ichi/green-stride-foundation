import { Link } from "@tanstack/react-router";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { levelFromScore, TRUST_LEVELS } from "@/hooks/use-trust";

export function TrustScoreCard({ score, verified }: { score: number; verified: boolean }) {
  const level = levelFromScore(score);
  const info = TRUST_LEVELS[level];
  return (
    <Link
      to="/verification"
      className="block rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-xl p-2.5" style={{ background: `color-mix(in oklab, ${info.color} 15%, transparent)`, color: info.color }}>
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Trust Score</p>
          <p className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{score}</span>
            <span className="text-xs font-medium" style={{ color: info.color }}>{info.label}</span>
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: info.color }} />
      </div>
      {!verified && (
        <p className="mt-2 text-[11px] text-muted-foreground">Verify your location to boost your score →</p>
      )}
    </Link>
  );
}
