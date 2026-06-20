import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "../AppShell";

describe("AppShell", () => {
  it("renders title as h1 and children inside <main>", () => {
    render(<AppShell title="Dashboard"><p>hello</p></AppShell>);
    const heading = screen.getByRole("heading", { level: 1, name: "Dashboard" });
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("hello");
  });
  it("renders subtitle when provided", () => {
    render(<AppShell title="t" subtitle="sub">x</AppShell>);
    expect(screen.getByText("sub")).toBeInTheDocument();
  });
});
