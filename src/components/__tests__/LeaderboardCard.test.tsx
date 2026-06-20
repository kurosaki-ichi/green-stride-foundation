import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardCard } from "../cards/LeaderboardCard";

describe("LeaderboardCard", () => {
  it("renders rank, name, and points", () => {
    render(<LeaderboardCard rank={4} name="Ada Lovelace" points={5000} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
  });
  it("shows kg saved when provided", () => {
    render(<LeaderboardCard rank={1} name="x y" points={1} saved={12.34} />);
    expect(screen.getByText(/12.3 kg saved/)).toBeInTheDocument();
  });
  it("shows trust pill", () => {
    render(<LeaderboardCard rank={1} name="x" points={1} trustScore={91} />);
    expect(screen.getByText(/Trust 91/)).toBeInTheDocument();
  });
  it("renders avatar img with empty alt when avatar URL provided", () => {
    render(<LeaderboardCard rank={1} name="x" points={1} avatar="/a.png" />);
    expect(screen.getByRole("img")).toHaveAttribute("alt", "");
  });
  it("shows trend arrows", () => {
    const { rerender } = render(<LeaderboardCard rank={1} name="x" points={1} trend="up" trendDelta={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    rerender(<LeaderboardCard rank={1} name="x" points={1} trend="down" trendDelta={2} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    rerender(<LeaderboardCard rank={1} name="x" points={1} trend="same" />);
  });
});
