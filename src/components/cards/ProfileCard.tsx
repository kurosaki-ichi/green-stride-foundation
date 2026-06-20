import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileCard({
  name,
  email,
  area,
  points,
  trustScore,
  photo,
}: {
  name: string;
  email?: string;
  area?: string;
  points: number;
  trustScore: number;
  photo?: string | null;
}) {
  const initials = (name || email || "U").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 ring-2 ring-primary/20">
          {photo && <AvatarImage src={photo} />}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{name || "Eco user"}</h2>
          {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          {area && <p className="text-xs text-muted-foreground">{area}</p>}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Green points</p>
          <p className="mt-1 text-xl font-semibold text-primary">{points.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Trust score</p>
          <p className="mt-1 text-xl font-semibold">{trustScore}</p>
        </div>
      </div>
    </div>
  );
}
