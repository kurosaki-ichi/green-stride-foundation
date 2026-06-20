import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommunityChallengeCard } from "../community/CommunityChallengeCard";

const c: any = {
  scope: "city", title: "Plant 1000 trees", description: "City-wide goal",
  current_progress: 250, target: 1000, reward: 100,
};

describe("CommunityChallengeCard", () => {
  it("renders title, scope, and progress", () => {
    render(<CommunityChallengeCard c={c} />);
    expect(screen.getByText("Plant 1000 trees")).toBeInTheDocument();
    expect(screen.getByText(/city goal/i)).toBeInTheDocument();
    expect(screen.getByText(/250 \/ 1,000/)).toBeInTheDocument();
    expect(screen.getByText(/\+100 pts/)).toBeInTheDocument();
  });
  it("caps progress at 100%", () => {
    render(<CommunityChallengeCard c={{ ...c, current_progress: 2000 }} />);
    expect(screen.getByText(/2,000 \/ 1,000/)).toBeInTheDocument();
  });
});
