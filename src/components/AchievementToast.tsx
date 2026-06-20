import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Trophy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type A = Tables<"achievement_history">;

export function AchievementCelebration() {
  const [item, setItem] = useState<A | null>(null);

  useEffect(() => {
    let mounted = true;
    const seenKey = "ecorewards.seen_achievements_until";
    const since = localStorage.getItem(seenKey) ?? new Date(Date.now() - 60_000).toISOString();

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || !mounted) return;
      const { data } = await supabase.from("achievement_history").select("*")
        .eq("user_id", u.user.id).gt("created_at", since)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (mounted && data) {
        setItem(data);
        localStorage.setItem(seenKey, new Date().toISOString());
      } else {
        localStorage.setItem(seenKey, new Date().toISOString());
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card-hover)]"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              {item.type === "badge" ? <Trophy className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                {item.type === "badge" ? "Badge unlocked" : "Challenge complete"}
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-tight">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              )}
              {item.points_awarded > 0 && (
                <p className="mt-1.5 text-xs font-semibold text-primary">+{item.points_awarded} Green Points</p>
              )}
            </div>
            <button onClick={() => setItem(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
