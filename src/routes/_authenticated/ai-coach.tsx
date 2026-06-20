import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-coach")({
  head: () => ({ meta: [{ title: "AI Coach — EcoRewards AI" }] }),
  component: () => (
    <AppShell title="AI Coach" subtitle="Personalized sustainability tips.">
      <EmptyState
        icon={Sparkles}
        title="Your coach is warming up"
        description="Chat-based recommendations, forecasts, and city comparisons will live here."
      />
    </AppShell>
  ),
});
