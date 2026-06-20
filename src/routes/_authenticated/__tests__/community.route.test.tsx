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

vi.mock("@/hooks/use-community", () => ({
  useFeed: () => ({ posts: [], loading: false, refresh: vi.fn() }),
  useCommunityChallenges: () => [],
}));
vi.mock("@/components/community/PostCard", () => ({ PostCard: () => null }));
vi.mock("@/components/community/PostComposer", () => ({ PostComposer: () => null }));
vi.mock("@/components/community/CommunityChallengeCard", () => ({ CommunityChallengeCard: () => null }));
vi.mock("@/components/community/TopContributorsWidget", () => ({ TopContributorsWidget: () => null }));

import { Route } from "@/routes/_authenticated/community";

describe("Community route", () => {
  it("renders the heading and empty state", () => {
    const Component: any = (Route as any).options.component;
    render(<Component />);
    expect(screen.getByRole("heading", { level: 1, name: /Community/i })).toBeInTheDocument();
    expect(screen.getByText(/No posts yet/i)).toBeInTheDocument();
  });
});
