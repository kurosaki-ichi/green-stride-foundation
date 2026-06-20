import { Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function WalletCard({ wallet }: { wallet: Tables<"points_wallet"> | null }) {
  const balance = wallet?.balance ?? 0;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-[color:var(--success)] p-5 text-primary-foreground shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide opacity-80">Green wallet</p>
        <Sparkles className="h-4 w-4 opacity-90" />
      </div>
      <p className="mt-1 text-4xl font-bold tabular-nums">
        {balance.toLocaleString()} <span className="text-base font-medium opacity-90">pts</span>
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Mini label="Lifetime" value={wallet?.lifetime_earned ?? 0} />
        <Mini label="This month" value={wallet?.month_earned ?? 0} />
        <Mini label="Spent" value={wallet?.lifetime_spent ?? 0} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/15 p-2 text-center backdrop-blur">
      <p className="text-[10px] uppercase opacity-80">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
