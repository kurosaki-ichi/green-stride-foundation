import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    Link: ({ to, children, ...rest }: any) =>
      React.createElement("a", { href: typeof to === "string" ? to : "#", ...rest }, children),
    useNavigate: () => vi.fn(),
    useRouter: () => ({ invalidate: vi.fn(), navigate: vi.fn() }),
    useRouterState: () => "/",
    createFileRoute: () => (opts: any) => ({ options: opts }),
    createRootRouteWithContext: () => () => ({}),
    redirect: vi.fn(),
    Outlet: () => null,
    getRouteApi: () => ({ useLoaderData: () => ({}), useParams: () => ({}), useSearch: () => ({}) }),
  };
});

vi.mock("@/hooks/use-theme", () => ({ useTheme: () => ({ theme: "light", toggle: vi.fn() }) }));
vi.mock("@/hooks/use-profile", () => ({
  useProfile: () => ({
    profile: { id: "u1", name: "Alex Doe", green_points: 100, trust_score: 80, area: "A", city: "C", state: "S", location_verified: true },
    loading: false,
  }),
}));
vi.mock("@/hooks/use-stats", () => ({
  useStats: () => ({ stats: { total_trips: 5, total_distance: 12, total_saved: 3, total_co2: 4 }, carbon: { daily: 1, weekly: 2, monthly: 3, totalSaved: 4 }, loading: false }),
  useWeeklyTrend: () => ({ data: [], loading: false }),
  useTransportBreakdown: () => ({ data: [], loading: false }),
}));
vi.mock("@/hooks/use-rankings", () => ({
  useMyRanks: () => ({ row: null, loading: false }),
  useRankHistory: () => ({ rows: [] }),
  useAreaStats: () => ({ rows: [] }),
}));
vi.mock("@/hooks/use-gamification", () => ({
  useWallet: () => ({ wallet: { balance: 0, lifetime_earned: 0, month_earned: 0 } }),
  useStreak: () => ({ streak: { current_streak: 1, longest_streak: 2 } }),
  useChallenges: () => ({ items: [] }),
}));
vi.mock("@/hooks/use-rewards", () => ({
  useRewardsCatalog: () => ({ rewards: [] }),
  useMyTier: () => null,
  useRedemptions: () => ({ items: [] }),
}));
vi.mock("@/hooks/use-community", () => ({
  useFeed: () => ({ posts: [] }),
  useCommunityChallenges: () => [],
}));
vi.mock("@/hooks/use-ai", () => ({ useSustainabilityScore: () => ({ score: null }) }));

vi.mock("@/components/ai/ForecastCard", () => ({ ForecastCard: () => null }));
vi.mock("@/components/ai/SustainabilityScoreCard", () => ({ SustainabilityScoreCard: () => null }));
vi.mock("@/components/ai/RecommendationsList", () => ({ RecommendationsList: () => null }));
vi.mock("@/components/community/CommunityChallengeCard", () => ({ CommunityChallengeCard: () => null }));

import { Route } from "@/routes/_authenticated/dashboard";

describe("Dashboard route", () => {
  it("renders the page heading and stat cards", () => {
    const Component: any = (Route as any).options.component;
    render(<Component />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Hi Alex/i);
    expect(screen.getByText(/Daily CO/i)).toBeInTheDocument();
  });
});
