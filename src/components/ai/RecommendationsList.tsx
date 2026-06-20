import { Link } from "@tanstack/react-router";
import { Lightbulb, X } from "lucide-react";
import { useRecommendations } from "@/hooks/use-ai";

export function RecommendationsList({ limit }: { limit?: number }) {
  const { items, dismiss } = useRecommendations();
  const list = limit ? items.slice(0, limit) : items;
  if (list.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {list.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-warning/15 p-1.5 text-warning shrink-0"><Lightbulb className="h-4 w-4" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{r.title}</p>
              {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
              <div className="mt-2 flex items-center gap-2">
                {r.impact && <span className="text-[10px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded-full">{r.impact}</span>}
                {r.cta_link && r.cta_label && (
                  <Link to={r.cta_link} className="text-[11px] font-semibold text-primary">{r.cta_label} →</Link>
                )}
              </div>
            </div>
            {!r.is_global && (
              <button onClick={() => dismiss(r.id)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
