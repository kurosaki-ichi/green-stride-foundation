import { useState } from "react";
import { TrendingDown } from "lucide-react";
import { useForecast } from "@/hooks/use-ai";
import { cn } from "@/lib/utils";

const HORIZONS = [
  { d: 7, label: "7 days" },
  { d: 30, label: "30 days" },
  { d: 90, label: "90 days" },
  { d: 365, label: "1 year" },
] as const;

export function ForecastCard() {
  const [horizon, setHorizon] = useState(30);
  const { forecast, loading } = useForecast(horizon);
  const pct = forecast && Number(forecast.predicted_co2) > 0
    ? Math.round((Number(forecast.potential_reduction) / Number(forecast.predicted_co2)) * 100) : 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-success/10 p-1.5 text-success"><TrendingDown className="h-4 w-4" /></span>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Carbon forecast</p>
        </div>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {HORIZONS.map((h) => (
          <button key={h.d} onClick={() => setHorizon(h.d)}
            className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border",
              horizon === h.d ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border")}>{h.label}</button>
        ))}
      </div>
      {loading || !forecast ? (
        <div className="mt-4 h-24 bg-muted/40 rounded-2xl animate-pulse" />
      ) : (
        <div className="mt-4 space-y-2.5">
          <Row label="Current trajectory" value={`${Number(forecast.current_co2).toFixed(1)} kg`} />
          <Row label="Predicted" value={`${Number(forecast.predicted_co2).toFixed(1)} kg`} accent="warning" />
          <Row label="Recommended" value={`${Number(forecast.recommended_co2).toFixed(1)} kg`} accent="success" />
          <div className="mt-3 rounded-2xl bg-success/5 border border-success/20 p-3">
            <p className="text-[11px] text-success/80 uppercase tracking-wide font-medium">Potential reduction</p>
            <p className="text-xl font-semibold text-success tabular-nums">
              {Number(forecast.potential_reduction).toFixed(1)} kg <span className="text-xs font-normal">(-{pct}%)</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "success" | "warning" }) {
  const c = accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", c)}>{value}</span>
    </div>
  );
}
