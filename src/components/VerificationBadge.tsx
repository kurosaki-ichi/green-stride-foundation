import { ShieldCheck, Award, Sparkles, Leaf, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type TierSlug =
  | "eco_leader"
  | "community_champion"
  | "trusted_contributor"
  | "eco_explorer"
  | "new_member";

const META: Record<TierSlug, { label: string; short: string; icon: any; cls: string }> = {
  eco_leader: {
    label: "Verified Eco Leader",
    short: "Eco Leader",
    icon: ShieldCheck,
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30",
  },
  community_champion: {
    label: "Community Champion",
    short: "Champion",
    icon: Award,
    cls: "bg-amber-400/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/30",
  },
  trusted_contributor: {
    label: "Trusted Contributor",
    short: "Trusted",
    icon: Sparkles,
    cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30",
  },
  eco_explorer: {
    label: "Eco Explorer",
    short: "Explorer",
    icon: Leaf,
    cls: "bg-lime-500/15 text-lime-700 dark:text-lime-300 ring-1 ring-lime-500/30",
  },
  new_member: {
    label: "New Member",
    short: "New",
    icon: User,
    cls: "bg-muted text-muted-foreground ring-1 ring-border",
  },
};

export function VerificationBadge({
  tier,
  size = "sm",
  withLabel = true,
}: {
  tier?: string | null;
  size?: "xs" | "sm" | "md";
  withLabel?: boolean;
}) {
  const slug = (tier as TierSlug) in META ? (tier as TierSlug) : "new_member";
  const m = META[slug];
  const Icon = m.icon;
  const sizing =
    size === "xs"
      ? "h-4 px-1.5 text-[9px] gap-1"
      : size === "md"
        ? "h-7 px-2.5 text-xs gap-1.5"
        : "h-5 px-2 text-[10px] gap-1";
  return (
    <span
      title={m.label}
      className={cn(
        "inline-flex items-center rounded-full font-semibold whitespace-nowrap",
        sizing,
        m.cls,
      )}
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {withLabel && (size === "md" ? m.label : m.short)}
    </span>
  );
}
