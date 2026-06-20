import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SustainabilityScoreCard } from "../ai/SustainabilityScoreCard";

describe("SustainabilityScoreCard", () => {
  it("renders zero state when no score", () => {
    render(<SustainabilityScoreCard s={null} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/Sustainability score/i)).toBeInTheDocument();
  });
  it("renders the score and all factor labels", () => {
    const s: any = { score: 76, transport: 80, challenges: 60, community: 40, trust: 90, consistency: 70 };
    render(<SustainabilityScoreCard s={s} />);
    expect(screen.getByText("76")).toBeInTheDocument();
    ["Transport", "Challenges", "Community", "Trust", "Consistency"].forEach((l) =>
      expect(screen.getByText(l)).toBeInTheDocument(),
    );
  });
});
