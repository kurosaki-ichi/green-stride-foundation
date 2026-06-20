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
  useProfile: () => ({ profile: { id: "u1", state: "S", city: "C", area: "A" } }),
}));
vi.mock("@/hooks/use-phase9", () => ({
  useLeaderboardV2: () => ({ rows: [], loading: false }),
}));
vi.mock("@/hooks/use-rankings", () => ({
  useAreaStats: () => ({ rows: [], loading: false }),
  useCityStats: () => ({ rows: [], loading: false }),
  useStateStats: () => ({ rows: [], loading: false }),
}));

import { Route } from "@/routes/_authenticated/leaderboard";

describe("Leaderboard route", () => {
  it("renders heading and tabs", () => {
    const Component: any = (Route as any).options.component;
    render(<Component />);
    expect(screen.getByRole("heading", { level: 1, name: /Leaderboard/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Individuals/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Community/i })).toBeInTheDocument();
  });
});
