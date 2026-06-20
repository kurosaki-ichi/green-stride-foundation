import { Crown } from "lucide-react";
import { useTopContributors } from "@/hooks/use-community";

export function TopContributorsWidget() {
  const list = useTopContributors(5);
  if (list.length === 0) return null;
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold">Top contributors</h3>
      </div>
      <ul className="space-y-2.5">
        {list.map((c, i) => (
          <li key={c.user_id} className="flex items-center gap-3">
            <span className="w-5 text-xs font-semibold text-muted-foreground">{i + 1}</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold overflow-hidden">
              {c.photo ? <img src={c.photo} alt="" className="h-full w-full object-cover" /> : c.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{c.posts} posts · {c.likes_received} likes</p>
            </div>
            <span className="text-xs font-semibold text-primary">{c.green_points}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
