import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, ChevronRight, MapPin, Settings, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — EcoRewards AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [p, setP] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      setP(prof);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <AppShell title="Profile">
      <ProfileCard
        name={p?.name ?? ""}
        email={p?.email ?? undefined}
        area={p?.area ? `${p.area}, ${p.city}` : undefined}
        points={p?.green_points ?? 0}
        trustScore={p?.trust_score ?? 50}
        photo={p?.profile_photo}
      />

      <div className="mt-5 space-y-2">
        <Row icon={Award} label="Achievements" value="3 badges" />
        <Row icon={MapPin} label="Location" value={p?.city ?? "Not set"} />
        <Row icon={Settings} label="Preferences" value="Manage" />
      </div>

      <Button onClick={signOut} variant="outline" className="mt-6 h-11 w-full rounded-xl">
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </AppShell>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="rounded-lg bg-muted p-2 text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
