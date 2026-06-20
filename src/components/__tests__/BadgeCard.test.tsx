import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BadgeCard } from "../cards/BadgeCard";

const badge: any = {
  id: "1", name: "Eco Explorer", description: "First steps",
  icon: "Leaf", tier: "bronze", reward: 50,
};

describe("BadgeCard", () => {
  it("renders name and reward", () => {
    render(<BadgeCard badge={badge} earned={true} />);
    expect(screen.getByText("Eco Explorer")).toBeInTheDocument();
    expect(screen.getByText("+50")).toBeInTheDocument();
  });
  it("shows earned date when provided", () => {
    render(<BadgeCard badge={badge} earned earnedAt="2026-01-15" />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });
  it("dims when not earned", () => {
    const { container } = render(<BadgeCard badge={badge} earned={false} />);
    expect(container.firstChild).toHaveClass("opacity-60");
  });
});
