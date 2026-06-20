import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Footprints, Bike, Bus, TrainFront, Car, Sparkles,
  Trophy, Users, Leaf, Check,
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
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [transports, setTransports] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>("");
  const [saving, setSaving] = useState(false);

  function toggleTransport(id: string) {
    setTransports((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async function finish() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Session expired"); }
    const { error } = await supabase.from("profiles").update({
      name, state, city, area,
      transport_habits: transports,
      primary_goal: goal,
      onboarding_complete: true,
    }).eq("id", u.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("You're all set!");
    navigate({ to: "/dashboard" });
  }

  const canNext =
    (step === 1 && name && state && city && area) ||
    (step === 2 && transports.length > 0) ||
    (step === 3 && goal);

  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
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
                <h1 className="text-2xl font-semibold tracking-tight">Tell us about you</h1>
                <p className="mt-1 text-sm text-muted-foreground">We'll use this for community rankings.</p>
                <div className="mt-6 space-y-4">
                  <Field label="Full name" value={name} onChange={setName} />
                  <Field label="State" value={state} onChange={setState} />
                  <Field label="City" value={city} onChange={setCity} />
                  <Field label="Area / Locality" value={area} onChange={setArea} />
                </div>
              </>
            )}

            {step === 2 && (
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
                        {active && <Check className="absolute -top-0 h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 3 && (
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
          {step < 3 ? (
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
