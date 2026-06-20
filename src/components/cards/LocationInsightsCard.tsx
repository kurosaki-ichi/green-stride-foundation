import { MapPin, TrendingDown, TrendingUp } from "lucide-react";

type Props = {
  area?: string | null;
  city?: string | null;
  userAvg?: number;
  areaAvg?: number;
  areaRank?: number | null;
};

export function LocationInsightsCard({ area, city, userAvg = 0, areaAvg = 0, areaRank }: Props) {
  const better = userAvg > 0 && userAvg < areaAvg;
  const diffPct = areaAvg > 0 ? Math.round(((areaAvg - userAvg) / areaAvg) * 100) : 0;
  return (
    <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-primary/10 p-1.5 text-primary"><MapPin className="h-4 w-4" /></span>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Location insights</p>
      </div>
      <p className="mt-2 text-sm font-semibold">
        {area || city || "Set your location"}
        {city && area ? `, ${city}` : ""}
      </p>
      {userAvg > 0 && areaAvg > 0 ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {better ? (
            <TrendingDown className="h-3.5 w-3.5 text-[color:var(--success)]" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5 text-[color:var(--warning)]" />
          )}
          You emit <span className="font-semibold text-foreground">{Math.abs(diffPct)}%</span> {better ? "less" : "more"} than your area average
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Log trips to compare with your area.</p>
      )}
      {areaRank ? (
        <p className="mt-1 text-xs text-muted-foreground">Your area ranks <span className="font-semibold text-foreground">#{areaRank}</span> in the city</p>
      ) : null}
    </div>
  );
}
