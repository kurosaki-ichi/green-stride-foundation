import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChallengeCard } from "../cards/ChallengeCard";

const ch: any = {
  id: "1", type: "daily", title: "Cycle 5km", description: "Get on the bike",
  icon: "Target", metric: "distance_cycle", target: 5, progress: 2, reward: 50, completed: false,
};

describe("ChallengeCard", () => {
  it("renders title, type, reward, and progress", () => {
    render(<ChallengeCard challenge={ch} />);
    expect(screen.getByText("Cycle 5km")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("+50")).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 5 km/)).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });
  it("shows Completed badge when done", () => {
    render(<ChallengeCard challenge={{ ...ch, completed: true, progress: 5 }} />);
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
  it("handles a 0 target without dividing by zero", () => {
    render(<ChallengeCard challenge={{ ...ch, target: 0, progress: 0 }} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
