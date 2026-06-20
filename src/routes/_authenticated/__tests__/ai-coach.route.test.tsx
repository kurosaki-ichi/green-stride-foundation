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

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({ messages: [], sendMessage: vi.fn(), status: "ready", error: null }),
}));
vi.mock("ai", () => ({ DefaultChatTransport: class { constructor(_: any) {} } }));
vi.mock("react-markdown", () => ({ default: ({ children }: any) => children }));

import { Route } from "@/routes/_authenticated/ai-coach";

describe("AI Coach route", () => {
  it("renders heading and suggestion prompts", () => {
    const Component: any = (Route as any).options.component;
    render(<Component />);
    expect(screen.getByRole("heading", { level: 1, name: /AI Coach/i })).toBeInTheDocument();
    expect(screen.getByText(/EcoCoach/i)).toBeInTheDocument();
    expect(screen.getByText(/reduce my carbon footprint/i)).toBeInTheDocument();
  });
});
