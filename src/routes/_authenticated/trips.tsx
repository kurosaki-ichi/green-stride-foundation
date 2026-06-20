import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { useTrips } from "@/hooks/use-trips";
import { TRANSPORT_LABELS, type TransportMode } from "@/lib/carbon";
import { Activity, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/trips")({
  head: () => ({ meta: [{ title: "Trips — EcoRewards AI" }] }),
  component: TripsPage,
});

function TripsPage() {
  const { trips, loading } = useTrips();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<"date" | "co2" | "distance">("date");

  const filtered = useMemo(() => {
    let xs = trips.slice();
    if (filter !== "all") xs = xs.filter((t) => t.transport_mode === filter);
    if (query) {
      const q = query.toLowerCase();
      xs = xs.filter(
        (t) =>
          (t.notes ?? "").toLowerCase().includes(q) ||
          (TRANSPORT_LABELS[t.transport_mode as TransportMode] ?? "").toLowerCase().includes(q),
      );
    }
    if (sort === "co2") xs.sort((a, b) => Number(b.co2_generated) - Number(a.co2_generated));
    else if (sort === "distance") xs.sort((a, b) => Number(b.distance_km) - Number(a.distance_km));
    else xs.sort((a, b) => (a.trip_date < b.trip_date ? 1 : -1));
    return xs;
  }, [trips, query, filter, sort]);

  return (
    <AppShell title="Trip history" subtitle={`${trips.length} trips logged`}>
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes or mode"
            className="h-11 rounded-xl pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              {Object.entries(TRANSPORT_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most recent</SelectItem>
              <SelectItem value="co2">Highest CO₂</SelectItem>
              <SelectItem value="distance">Longest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={Activity}
            title="No trips match"
            description="Try a different filter, or log a new trip."
          />
        )}
        {filtered.map((t) => (
          <div key={t.id} className="rounded-xl bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{TRANSPORT_LABELS[t.transport_mode as TransportMode]}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.trip_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}
                  {Number(t.distance_km)} km · {t.duration_minutes} min
                </p>
                {t.notes && <p className="mt-1 text-xs text-muted-foreground">{t.notes}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{Number(t.co2_generated).toFixed(2)} kg</p>
                <p className="text-xs text-primary">−{Number(t.co2_saved).toFixed(2)} saved</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
