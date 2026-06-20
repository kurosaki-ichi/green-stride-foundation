import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/use-profile";
import { TRANSPORT_LABELS, type TransportMode } from "@/lib/carbon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/edit-profile")({
  head: () => ({ meta: [{ title: "Edit profile — EcoRewards AI" }] }),
  component: EditProfile,
});

function EditProfile() {
  const navigate = useNavigate();
  const { profile, loading, update } = useProfile();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [photo, setPhoto] = useState("");
  const [habits, setHabits] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setCity(profile.city ?? "");
    setArea(profile.area ?? "");
    setPhoto(profile.profile_photo ?? "");
    setHabits(profile.transport_habits ?? []);
  }, [profile]);

  function toggle(id: string) {
    setHabits((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await update({
        name, city, area,
        profile_photo: photo || null,
        transport_habits: habits,
      });
      toast.success("Profile updated");
      navigate({ to: "/profile" });
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Edit profile">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit profile">
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" className="h-11 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" className="h-11 rounded-xl" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="area">Area</Label>
          <Input id="area" className="h-11 rounded-xl" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="photo">Profile photo URL</Label>
          <Input id="photo" className="h-11 rounded-xl" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://..." />
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Transport preferences</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(TRANSPORT_LABELS).map(([id, label]) => {
              const active = habits.includes(id);
              return (
                <button
                  key={id} type="button" onClick={() => toggle(id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => navigate({ to: "/profile" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="h-11 flex-1 rounded-xl">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
