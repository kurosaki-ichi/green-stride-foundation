import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerificationBadge } from "../VerificationBadge";

describe("VerificationBadge", () => {
  it("renders known tier label", () => {
    render(<VerificationBadge tier="eco_leader" size="md" />);
    expect(screen.getByText("Verified Eco Leader")).toBeInTheDocument();
  });
  it("falls back to new_member for unknown tier", () => {
    render(<VerificationBadge tier="unknown" size="md" />);
    expect(screen.getByText("New Member")).toBeInTheDocument();
  });
  it("renders short label by default", () => {
    render(<VerificationBadge tier="community_champion" />);
    expect(screen.getByText("Champion")).toBeInTheDocument();
  });
  it("hides label when withLabel=false", () => {
    const { container } = render(<VerificationBadge tier="eco_leader" withLabel={false} />);
    expect(container.textContent?.trim()).toBe("");
  });
  it("handles null tier", () => {
    render(<VerificationBadge tier={null} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });
});
