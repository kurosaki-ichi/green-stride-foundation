import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LeaderboardCard } from "@/components/cards/LeaderboardCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const individuals = [
  { rank: 1, name: "Aarav P.", meta: "Indiranagar, Bengaluru", points: 4820 },
  { rank: 2, name: "Saanvi M.", meta: "Koramangala, Bengaluru", points: 4510 },
  { rank: 3, name: "Rohan K.", meta: "Whitefield, Bengaluru", points: 4205 },
  { rank: 12, name: "You", meta: "Your area", points: 1240, highlight: true },
];

const communities = [
  { rank: 1, name: "Indiranagar", meta: "Bengaluru • 1,204 users", points: 92000 },
  { rank: 2, name: "Koramangala", meta: "Bengaluru • 980 users", points: 84500 },
  { rank: 3, name: "HSR Layout", meta: "Bengaluru • 760 users", points: 71200 },
];

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — EcoRewards AI" }] }),
  component: () => (
    <AppShell title="Leaderboard" subtitle="See who's leading the green change.">
      <Tabs defaultValue="individual">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="individual" className="rounded-lg">Individual</TabsTrigger>
          <TabsTrigger value="community" className="rounded-lg">Community</TabsTrigger>
        </TabsList>
        <TabsContent value="individual" className="mt-4 space-y-2">
          {individuals.map((u) => <LeaderboardCard key={u.rank} {...u} />)}
        </TabsContent>
        <TabsContent value="community" className="mt-4 space-y-2">
          {communities.map((u) => <LeaderboardCard key={u.rank} {...u} />)}
        </TabsContent>
      </Tabs>
    </AppShell>
  ),
});
