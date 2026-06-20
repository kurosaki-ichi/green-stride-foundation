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

vi.mock("@/hooks/use-profile", () => ({
  useProfile: () => ({
    profile: { id: "u1", name: "Alex Doe", email: "a@b.co", area: "A", city: "C", green_points: 100, trust_score: 80, profile_photo: null },
    loading: false,
  }),
}));
vi.mock("@/hooks/use-stats", () => ({
  useStats: () => ({ stats: { total_trips: 5, total_distance: 12, total_saved: 3 } }),
}));
vi.mock("@/hooks/use-trips", () => ({ useTrips: () => ({ trips: [] }) }));
vi.mock("@/hooks/use-gamification", () => ({ useStreak: () => ({ streak: { current_streak: 1, longest_streak: 2 } }) }));

import { Route } from "@/routes/_authenticated/profile";

describe("Profile route", () => {
  it("renders the profile heading and stats", () => {
    const Component: any = (Route as any).options.component;
    render(<Component />);
    expect(screen.getByRole("heading", { level: 1, name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByText(/Recent trips/i)).toBeInTheDocument();
  });
});
