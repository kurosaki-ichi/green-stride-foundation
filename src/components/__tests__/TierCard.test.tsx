import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TierCard } from "../cards/TierCard";

const tier: any = { name: "Gold", icon: "trophy", color: "#facc15", multiplier: 1.5, benefits: ["2x weekend points", "Premium rewards"] };
const next: any = { name: "Platinum", min_lifetime_points: 5000 };

describe("TierCard", () => {
  it("shows current tier name and multiplier", () => {
    render(<TierCard current={tier} next={next} progress={50} remaining={2500} />);
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText(/×1.50/)).toBeInTheDocument();
    expect(screen.getByText(/Next: Platinum/)).toBeInTheDocument();
    expect(screen.getByText(/2,500 pts to go/)).toBeInTheDocument();
  });
  it("renders top-tier message when next is null", () => {
    render(<TierCard current={tier} next={null} progress={100} remaining={0} />);
    expect(screen.getByText(/top tier/i)).toBeInTheDocument();
  });
  it("renders benefits list when not compact", () => {
    render(<TierCard current={tier} next={next} progress={50} remaining={2500} />);
    expect(screen.getByText("2x weekend points")).toBeInTheDocument();
    expect(screen.getByText("Premium rewards")).toBeInTheDocument();
  });
  it("hides benefits in compact mode", () => {
    render(<TierCard current={tier} next={next} progress={50} remaining={2500} compact />);
    expect(screen.queryByText("Premium rewards")).toBeNull();
  });
});
