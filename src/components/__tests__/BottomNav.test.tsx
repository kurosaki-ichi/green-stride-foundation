import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "../BottomNav";

describe("BottomNav", () => {
  it("renders all five nav items", () => {
    render(<BottomNav />);
    ["Home", "Track", "Feed", "Rewards", "Profile"].forEach((l) => {
      expect(screen.getByText(l)).toBeInTheDocument();
    });
  });
  it("renders a navigation landmark", () => {
    render(<BottomNav />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
