import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community — EcoRewards AI" }] }),
  component: () => (
    <AppShell title="Community" subtitle="Share your wins with the movement.">
      <EmptyState
        icon={Users}
        title="Feed coming soon"
        description="Photos, achievements, and challenges from your area will appear here."
      />
    </AppShell>
  ),
});
