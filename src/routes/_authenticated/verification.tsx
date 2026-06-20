import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShieldCheck, MapPin, Home, Briefcase, Locate, Check, AlertTriangle, ChevronRight } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGeolocation } from "@/hooks/use-location";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { useVerification, TRUST_LEVELS, levelFromScore } from "@/hooks/use-trust";

export const Route = createFileRoute("/_authenticated/verification")({
  head: () => ({ meta: [{ title: "Verification — EcoRewards AI" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { profile, loading, update, refresh } = useProfile();
  const { fetchCurrent, loading: locating } = useGeolocation();
  const { records, history, loading: vLoading, record } = useVerification();
  const [busy, setBusy] = useState<string | null>(null);

  const score = profile?.trust_score ?? 50;
  const level = levelFromScore(score);
  const info = TRUST_LEVELS[level];

  const tasks = useMemo(() => [
    { id: "location", label: "Verify your current location", done: !!profile?.location_verified, points: 10 },
    { id: "home", label: "Add your home address", done: !!profile?.home_lat, points: 8 },
    { id: "work", label: "Add your college / work address", done: !!profile?.work_lat, points: 8 },
    { id: "gps", label: "Log a GPS-verified trip", done: records.some((r) => r.kind === "trip_gps"), points: 5 },
  ], [profile, records]);

  async function verifyCurrent() {
    setBusy("location");
    const p = await fetchCurrent();
    if (!p) { setBusy(null); return toast.error("Could not get your location"); }
    try {
      await record({
        kind: "location_current",
        source: "gps",
        latitude: p.latitude,
        longitude: p.longitude,
        address: p.address,
        metadata: { area: p.area, city: p.city, state: p.state, country: p.country },
      });
      await update({
        latitude: p.latitude,
        longitude: p.longitude,
        country: p.country ?? null,
        area: p.area ?? profile?.area,
        city: p.city ?? profile?.city,
        state: p.state ?? profile?.state,
        location_verified: true,
        verification_source: "gps",
      } as any);
      await refresh();
      toast.success("Location verified ✓");
    } catch (e: any) { toast.error(e.message); }
    setBusy(null);
  }

  if (loading) {
    return <AppShell title="Verification"><Skeleton className="h-40 rounded-2xl" /></AppShell>;
  }

  return (
    <AppShell title="Verification" subtitle="Boost your trust score by verifying your data.">
      <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl p-3" style={{ background: `color-mix(in oklab, ${info.color} 15%, transparent)`, color: info.color }}>
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Trust score</p>
            <p className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">{score}</span>
              <span className="text-sm font-medium" style={{ color: info.color }}>{info.label}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${score}%`, background: info.color }} />
        </div>
      </div>

      <section className="mt-5">
        <h2 className="text-sm font-semibold">Verification checklist</h2>
        <ul className="mt-3 space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
              <span className={`rounded-xl p-2 ${t.done ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : "bg-muted text-muted-foreground"}`}>
                {t.done ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">+{t.points} to trust score</p>
              </div>
              {t.done && <span className="text-[11px] font-semibold text-[color:var(--success)]">Done</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <Locate className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Quick verify</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">One tap — uses your device GPS.</p>
        <Button onClick={verifyCurrent} disabled={locating || busy === "location"} className="mt-3 h-11 w-full rounded-xl">
          {locating || busy === "location" ? "Verifying…" : "Verify current location"}
        </Button>
      </section>

      <section className="mt-5 space-y-3">
        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Home address</h2>
          </div>
          {profile?.home_address ? (
            <p className="mb-2 text-xs text-muted-foreground">Saved: {profile.home_address}</p>
          ) : null}
          <LocationAutocomplete
            placeholder="Search your home address"
            onSelect={async (s) => {
              setBusy("home");
              try {
                await update({
                  home_address: s.address, home_lat: s.latitude, home_lng: s.longitude,
                  area: profile?.area ?? s.area, city: profile?.city ?? s.city,
                  state: profile?.state ?? s.state,
                } as any);
                await record({ kind: "location_home", source: "address", latitude: s.latitude, longitude: s.longitude, address: s.address });
                toast.success("Home address saved");
              } catch (e: any) { toast.error(e.message); }
              setBusy(null);
            }}
          />
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">College / Work address</h2>
          </div>
          {profile?.work_address ? (
            <p className="mb-2 text-xs text-muted-foreground">Saved: {profile.work_address}</p>
          ) : null}
          <LocationAutocomplete
            placeholder="Search your college or office"
            onSelect={async (s) => {
              setBusy("work");
              try {
                const commute = profile?.home_lat && profile?.home_lng
                  ? Math.round(
                      haversine(profile.home_lat, profile.home_lng, s.latitude, s.longitude) * 10,
                    ) / 10
                  : null;
                await update({
                  work_address: s.address, work_lat: s.latitude, work_lng: s.longitude,
                  commute_km: commute,
                } as any);
                await record({ kind: "location_work", source: "address", latitude: s.latitude, longitude: s.longitude, address: s.address });
                toast.success("Work address saved");
              } catch (e: any) { toast.error(e.message); }
              setBusy(null);
            }}
          />
          {profile?.commute_km ? (
            <p className="mt-2 text-xs text-muted-foreground">Estimated commute: <span className="font-semibold text-foreground">{profile.commute_km} km</span> one-way</p>
          ) : null}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold">Verification history</h2>
        {vLoading ? (
          <Skeleton className="mt-3 h-24 rounded-2xl" />
        ) : history.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No verifications yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.slice(0, 10).map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-xl bg-card p-3 text-sm shadow-[var(--shadow-card)]">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium">{prettyReason(h.reason)}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-semibold ${h.delta >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--destructive)]"}`}>
                  {h.delta >= 0 ? "+" : ""}{h.delta}
                </span>
                <span className="text-[11px] text-muted-foreground">→ {h.new_score}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/profile" className="mt-5 flex items-center justify-between rounded-2xl bg-card p-4 text-sm shadow-[var(--shadow-card)]">
        <span>Back to profile</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </AppShell>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function prettyReason(r: string) {
  return r.replace(/_/g, " ").replace(":", " · ");
}
