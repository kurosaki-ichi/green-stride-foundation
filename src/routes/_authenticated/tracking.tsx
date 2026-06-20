import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTrips } from "@/hooks/use-trips";
import { calcCo2, EMISSION_FACTORS, TRANSPORT_LABELS, type TransportMode } from "@/lib/carbon";
import {
  Footprints, Bike, Bus, TrainFront, Car, Zap, CarTaxiFront, Leaf, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tracking")({
  head: () => ({ meta: [{ title: "Log a trip — EcoRewards AI" }] }),
  component: TrackingPage,
});

const MODES: { id: TransportMode; label: string; icon: any }[] = [
  { id: "walk", label: "Walk", icon: Footprints },
  { id: "cycle", label: "Cycle", icon: Bike },
  { id: "bike", label: "Bike", icon: Bike },
  { id: "bus", label: "Bus", icon: Bus },
  { id: "metro", label: "Metro", icon: TrainFront },
  { id: "car", label: "Car", icon: Car },
  { id: "ev", label: "EV", icon: Zap },
  { id: "auto", label: "Auto", icon: CarTaxiFront },
];

function TrackingPage() {
  const { trips, createTrip, loading } = useTrips(5);
  const [mode, setMode] = useState<TransportMode>("metro");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const dist = parseFloat(distance) || 0;
  const preview = calcCo2(mode, dist);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (dist <= 0) return toast.error("Enter a distance greater than 0");
    setSaving(true);
    try {
      await createTrip({
        transport_mode: mode,
        distance_km: dist,
        duration_minutes: parseInt(duration) || 0,
        trip_date: date,
        notes: notes || undefined,
      });
      toast.success(`Trip logged · saved ${preview.saved} kg CO₂`);
      setDistance(""); setDuration(""); setNotes("");
    } catch (e: any) {
      toast.error(e.message ?? "Could not save trip");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Log a trip" subtitle="Record how you got around.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mode</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {MODES.map((m) => {
              const active = mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance" inputMode="decimal" required className="h-11 rounded-xl"
              value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="5.2"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duration">Duration (min)</Label>
            <Input
              id="duration" inputMode="numeric" className="h-11 rounded-xl"
              value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" className="h-11 rounded-xl" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" className="min-h-[80px] rounded-xl" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Commute to office" />
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Estimated impact</p>
              <p className="text-sm font-semibold">
                {preview.generated} kg CO₂ generated · <span className="text-primary">{preview.saved} kg saved</span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Factor: {EMISSION_FACTORS[mode]} kg CO₂/km · vs car baseline
          </p>
        </div>

        <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl text-sm font-semibold">
          {saving ? "Saving..." : "Log trip"}
        </Button>
      </form>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent trips</h2>
          <Link to="/trips" className="flex items-center gap-1 text-xs font-medium text-primary">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {loading && <li className="h-14 animate-pulse rounded-xl bg-muted" />}
          {!loading && trips.length === 0 && (
            <li className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No trips yet. Log your first above.
            </li>
          )}
          {trips.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-xl bg-card p-3 shadow-[var(--shadow-card)]">
              <div>
                <p className="text-sm font-medium">{TRANSPORT_LABELS[t.transport_mode as TransportMode]}</p>
                <p className="text-xs text-muted-foreground">
                  {Number(t.distance_km)} km · {new Date(t.trip_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{Number(t.co2_generated).toFixed(2)} kg</p>
                <p className="text-xs text-primary">−{Number(t.co2_saved).toFixed(2)} saved</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
