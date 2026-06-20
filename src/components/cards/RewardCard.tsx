import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RewardCard({
  title,
  partner,
  cost,
  description,
}: {
  title: string;
  partner: string;
  cost: number;
  description?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Gift className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{partner}</p>
          <h4 className="text-sm font-semibold leading-tight">{title}</h4>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">{cost} pts</span>
        <Button size="sm" className="h-8 rounded-lg">Redeem</Button>
      </div>
    </div>
  );
}
