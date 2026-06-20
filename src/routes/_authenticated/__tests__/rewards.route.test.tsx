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

vi.mock("@/hooks/use-gamification", () => ({
  useWallet: () => ({ wallet: { balance: 250, lifetime_earned: 250, month_earned: 50 }, loading: false, refresh: vi.fn() }),
}));
vi.mock("@/hooks/use-rewards", () => ({
  useRewardsCatalog: () => ({ rewards: [], categories: [], loading: false, refresh: vi.fn() }),
  useMyTier: () => null,
  spendPoints: vi.fn(),
}));

import { Route } from "@/routes/_authenticated/rewards";

describe("Rewards route", () => {
  it("renders heading and search input", () => {
    const Component: any = (Route as any).options.component;
    render(<Component />);
    expect(screen.getByRole("heading", { level: 1, name: /Rewards/i })).toBeInTheDocument();
  });
});
