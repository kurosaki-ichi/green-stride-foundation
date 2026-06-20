import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileCard } from "../cards/ProfileCard";

describe("ProfileCard", () => {
  it("renders name, points and trust score", () => {
    render(<ProfileCard name="Alice Wong" points={1234} trustScore={88} />);
    expect(screen.getByRole("heading", { name: "Alice Wong" })).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
  });
  it("uses fallback name when blank", () => {
    render(<ProfileCard name="" points={0} trustScore={0} />);
    expect(screen.getByRole("heading", { name: "Eco user" })).toBeInTheDocument();
  });
  it("derives initials and shows email/area", () => {
    render(<ProfileCard name="Bob Lee" email="b@x.io" area="Soho" points={1} trustScore={1} />);
    expect(screen.getByText("BO")).toBeInTheDocument();
    expect(screen.getByText("b@x.io")).toBeInTheDocument();
    expect(screen.getByText("Soho")).toBeInTheDocument();
  });
});
