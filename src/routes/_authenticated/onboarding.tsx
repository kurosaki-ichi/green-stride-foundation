import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { useGeolocation } from "@/hooks/use-location";
import {
  Footprints, Bike, Bus, TrainFront, Car, Sparkles,
  Trophy, Users, Leaf, Check, Locate, Home, Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get started — EcoRewards AI" }] }),
  component: Onboarding,
});

const TRANSPORTS = [
  { id: "walk", label: "Walk", icon: Footprints },
  { id: "cycle", label: "Cycle", icon: Bike },
  { id: "bike", label: "Bike", icon: Bike },
  { id: "bus", label: "Bus", icon: Bus },
  { id: "metro", label: "Metro", icon: TrainFront },
  { id: "car", label: "Car", icon: Car },
] as const;

const GOALS = [
  { id: "reduce", label: "Reduce emissions", desc: "Lower my carbon footprint", icon: Leaf },
  { id: "rewards", label: "Earn rewards", desc: "Get coupons & perks", icon: Sparkles },
  { id: "compete", label: "Compete", desc: "Climb leaderboards", icon: Trophy },
  { id: "community", label: "Community", desc: "Help my area improve", icon: Users },
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const { fetchCurrent, loading: locating } = useGeolocation();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [verifiedSource, setVerifiedSource] = useState<"gps" | "address" | "manual" | null>(null);

  const [homeAddress, setHomeAddress] = useState("");
  const [homeLat, setHomeLat] = useState<number | null>(null);
  const [homeLng, setHomeLng] = useState<number | null>(null);
  const [workAddress, setWorkAddress] = useState("");
  const [workLat, setWorkLat] = useState<number | null>(null);
  const [workLng, setWorkLng] = useState<number | null>(null);

  const [transports, setTransports] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>("");
  const [saving, setSaving] = useState(false);

  function toggleTransport(id: string) {
    setTransports((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async function useCurrentLocation() {
    const p = await fetchCurrent();
    if (!p) return toast.error("Couldn't get your location. Allow location and try again.");
    setLat(p.latitude);
    setLng(p.longitude);
    if (p.area) setArea(p.area);
    if (p.city) setCity(p.city);
    if (p.state) setState(p.state);
    if (p.country) setCountry(p.country);
    setVerifiedSource("gps");
    toast.success("Location detected");
  }

  function haversine(a: number, b: number, c: number, d: number) {
    const R = 6371, toRad = (n: number) => (n * Math.PI) / 180;
    const dLat = toRad(c - a), dLng = toRad(d - b);
    const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  async function finish() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Session expired"); }
    const commute = homeLat && homeLng && workLat && workLng
      ? Math.round(haversine(homeLat, homeLng, workLat, workLng) * 10) / 10
      : null;
    const { error } = await supabase.from("profiles").update({
      name, state, city, area, country: country || null,
      latitude: lat, longitude: lng,
      home_address: homeAddress || null, home_lat: homeLat, home_lng: homeLng,
      work_address: workAddress || null, work_lat: workLat, work_lng: workLng,
      commute_km: commute,
      location_verified: verifiedSource !== null && verifiedSource !== "manual",
      verification_source: verifiedSource ?? "manual",
      transport_habits: transports,
      primary_goal: goal,
      onboarding_complete: true,
    } as any).eq("id", u.user.id);
    if (!error && verifiedSource && verifiedSource !== "manual" && lat && lng) {
      await supabase.rpc("record_verification" as any, {
        _kind: "location_current", _source: verifiedSource, _status: "verified",
        _lat: lat, _lng: lng, _address: `${area}, ${city}`, _metadata: null,
      });
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("You're all set!");
    navigate({ to: "/dashboard" });
  }

  const canNext =
    (step === 1 && name) ||
    (step === 2 && state && city && area) ||
    (step === 3 && transports.length > 0) ||
    (step === 4 && goal);

  return (
    <div className="min-h-dvh bg-background px-5 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              n <= step ? "bg-primary" : "bg-border",
            )} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">What's your name?</h1>
                <p className="mt-1 text-sm text-muted-foreground">We'll use this on your profile.</p>
                <div className="mt-6">
                  <Field label="Full name" value={name} onChange={setName} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">Where are you based?</h1>
                <p className="mt-1 text-sm text-muted-foreground">Powers your area rankings and insights.</p>

                <div className="mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="h-11 w-full rounded-xl"
                  >
                    <Locate className="mr-2 h-4 w-4" />
                    {locating ? "Detecting…" : "Use current location"}
                  </Button>
                  {verifiedSource === "gps" && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-[color:var(--success)]">
                      <Check className="h-3.5 w-3.5" /> GPS verified
                    </p>
                  )}
                </div>

                <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <div className="h-px flex-1 bg-border" /> or search <div className="h-px flex-1 bg-border" />
                </div>

                <LocationAutocomplete
                  label="Area / locality"
                  onSelect={(s) => {
                    setArea(s.label);
                    if (s.city) setCity(s.city);
                    if (s.state) setState(s.state);
                    if (s.country) setCountry(s.country);
                    setLat(s.latitude); setLng(s.longitude);
                    setVerifiedSource("address");
                  }}
                />

                <div className="mt-3 space-y-3">
                  <Field label="City" value={city} onChange={(v) => { setCity(v); if (!verifiedSource) setVerifiedSource("manual"); }} />
                  <Field label="State" value={state} onChange={(v) => { setState(v); if (!verifiedSource) setVerifiedSource("manual"); }} />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Home <span className="text-xs font-normal text-muted-foreground">(optional)</span></p>
                    </div>
                    <LocationAutocomplete
                      placeholder="Search your home address"
                      onSelect={(s) => { setHomeAddress(s.address); setHomeLat(s.latitude); setHomeLng(s.longitude); }}
                    />
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">College / Work <span className="text-xs font-normal text-muted-foreground">(optional)</span></p>
                    </div>
                    <LocationAutocomplete
                      placeholder="Search your college or office"
                      onSelect={(s) => { setWorkAddress(s.address); setWorkLat(s.latitude); setWorkLng(s.longitude); }}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">How do you usually travel?</h1>
                <p className="mt-1 text-sm text-muted-foreground">Pick all that apply.</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {TRANSPORTS.map(({ id, label, icon: Icon }) => {
                    const active = transports.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleTransport(id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-card p-5 text-sm font-medium transition-all",
                          active ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40",
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">Your main goal</h1>
                <p className="mt-1 text-sm text-muted-foreground">We'll personalize your experience.</p>
                <div className="mt-6 space-y-3">
                  {GOALS.map(({ id, label, desc, icon: Icon }) => {
                    const active = goal === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setGoal(id)}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-all",
                          active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                        )}
                      >
                        <div className={cn("rounded-xl p-2.5", active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        {active && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="h-11 flex-1 rounded-xl">
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="h-11 flex-1 rounded-xl text-sm font-semibold">
              Continue
            </Button>
          ) : (
            <Button onClick={finish} disabled={!canNext || saving} className="h-11 flex-1 rounded-xl text-sm font-semibold">
              {saving ? "Saving..." : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl" />
    </div>
  );
}
