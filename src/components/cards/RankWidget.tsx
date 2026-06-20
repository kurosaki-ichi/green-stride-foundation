import { Globe2, MapPin, Building2, Map as MapIcon } from "lucide-react";
import { percentile, percentileLabel } from "@/hooks/use-rankings";
import type { LBRow } from "@/hooks/use-rankings";

const items = [
  { key: "global_rank", label: "Global", icon: Globe2 },
  { key: "state_rank", label: "State", icon: MapIcon },
  { key: "city_rank", label: "City", icon: Building2 },
  { key: "area_rank", label: "Area", icon: MapPin },
] as const;

export function RankWidget({ row, loading }: { row: LBRow | null; loading?: boolean }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Your rankings</h3>
        <span className="text-xs text-muted-foreground">
          {row?.total_users ? `${row.total_users} users` : ""}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ key, label, icon: Icon }) => {
          const rank = (row?.[key] as number | null) ?? null;
          const pct = percentile(rank, row?.total_users ?? null);
          return (
            <div key={key} className="rounded-xl bg-muted/50 p-2.5 text-center">
              <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-base font-semibold tracking-tight">
                {loading ? "—" : rank ? `#${rank}` : "—"}
              </p>
              <p className="text-[10px] text-primary">{percentileLabel(pct) ?? ""}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
