import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/tracking")({
  head: () => ({ meta: [{ title: "Track — EcoRewards AI" }] }),
  component: () => (
    <AppShell title="Track a trip" subtitle="Log how you got around today.">
      <EmptyState
        icon={Activity}
        title="Tracking coming soon"
        description="GPS, ticket scan, and manual entry will live here. For now, enjoy your dashboard."
        action={<Button className="rounded-xl">Start a manual entry</Button>}
      />
    </AppShell>
  ),
});
