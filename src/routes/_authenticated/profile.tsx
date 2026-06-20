import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useStats } from "@/hooks/use-stats";
import { useTrips } from "@/hooks/use-trips";
import { TRANSPORT_LABELS, type TransportMode } from "@/lib/carbon";
import { LogOut, ChevronRight, MapPin, Pencil, Award, Activity, Wallet, Users, Flame } from "lucide-react";
import { useStreak } from "@/hooks/use-gamification";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — EcoRewards AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const { stats } = useStats();
  const { trips } = useTrips(3);
  const { streak } = useStreak();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading) {
    return (
      <AppShell title="Profile">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Profile">
      <ProfileCard
        name={profile?.name ?? ""}
        email={profile?.email ?? undefined}
        area={profile?.area ? `${profile.area}, ${profile.city}` : profile?.city ?? undefined}
        points={profile?.green_points ?? 0}
        trustScore={profile?.trust_score ?? 50}
        photo={profile?.profile_photo}
      />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Trips" value={stats?.total_trips ?? 0} />
        <Stat label="km" value={Number(stats?.total_distance ?? 0).toFixed(0)} />
        <Stat label="kg saved" value={Number(stats?.total_saved ?? 0).toFixed(1)} />
      </div>

      <div className="mt-5">
        <h2 className="text-sm font-semibold">Recent trips</h2>
        <ul className="mt-2 space-y-2">
          {trips.length === 0 && (
            <li className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No trips yet.
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
              <p className="text-xs text-primary">−{Number(t.co2_saved).toFixed(2)} kg</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 space-y-2">
        <Row to="/wallet" icon={Wallet} label="Green wallet" value="Points & transactions" />
        <Row to="/badges" icon={Award} label="Badges" value="Your achievements" />
        <Row to="/referrals" icon={Users} label="Refer friends" value="Earn 100 pts each" />
        <Row icon={Flame} label="Current streak" value={`${streak?.current_streak ?? 0} days · best ${streak?.longest_streak ?? 0}`} />
        <Row to="/edit-profile" icon={Pencil} label="Edit profile" value="Name, location, photo" />
        <Row to="/trips" icon={Activity} label="Trip history" value={`${stats?.total_trips ?? 0} logged`} />
        <Row icon={MapPin} label="Location" value={profile?.city ?? "Not set"} />
      </div>

      <Button onClick={signOut} variant="outline" className="mt-6 h-11 w-full rounded-xl">
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-card p-3 text-center shadow-[var(--shadow-card)]">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value, to }: { icon: any; label: string; value: string; to?: string }) {
  const inner = (
    <div className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="rounded-lg bg-muted p-2 text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : <button className="w-full">{inner}</button>;
}
