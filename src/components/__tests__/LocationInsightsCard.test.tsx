import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocationInsightsCard } from "../cards/LocationInsightsCard";

describe("LocationInsightsCard", () => {
  it("prompts location when none set", () => {
    render(<LocationInsightsCard />);
    expect(screen.getByText(/Set your location/i)).toBeInTheDocument();
  });
  it("shows percent better when user emits less", () => {
    render(<LocationInsightsCard area="Brera" city="Milan" userAvg={5} areaAvg={10} areaRank={3} />);
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    expect(screen.getByText(/less/i)).toBeInTheDocument();
    expect(screen.getByText(/#3/)).toBeInTheDocument();
  });
  it("shows percent more when user emits more", () => {
    render(<LocationInsightsCard area="A" city="C" userAvg={20} areaAvg={10} />);
    expect(screen.getByText(/more/i)).toBeInTheDocument();
  });
  it("prompts logging when only one of the two averages is set", () => {
    render(<LocationInsightsCard area="A" userAvg={0} areaAvg={5} />);
    expect(screen.getByText(/Log trips/i)).toBeInTheDocument();
  });
});
