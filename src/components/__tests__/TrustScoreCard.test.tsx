import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustScoreCard } from "../cards/TrustScoreCard";

describe("TrustScoreCard", () => {
  it("shows the score and label", () => {
    render(<TrustScoreCard score={75} verified={true} />);
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText(/Trusted Member/i)).toBeInTheDocument();
  });
  it("prompts verification when not verified", () => {
    render(<TrustScoreCard score={30} verified={false} />);
    expect(screen.getByText(/Verify your location/i)).toBeInTheDocument();
  });
  it("shows Eco Leader for high scores", () => {
    render(<TrustScoreCard score={95} verified={true} />);
    expect(screen.getByText(/Eco Leader/i)).toBeInTheDocument();
  });
});
