import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RankWidget } from "../cards/RankWidget";

describe("RankWidget", () => {
  it("renders all four rank tiles", () => {
    render(<RankWidget row={null} />);
    expect(screen.getByText("Global")).toBeInTheDocument();
    expect(screen.getByText("State")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
    expect(screen.getByText("Area")).toBeInTheDocument();
  });
  it("shows ranks when available", () => {
    const row: any = { global_rank: 12, state_rank: 5, city_rank: 2, area_rank: 1, total_users: 500 };
    render(<RankWidget row={row} />);
    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.getByText("500 users")).toBeInTheDocument();
  });
  it("shows em-dash placeholders when loading", () => {
    render(<RankWidget row={null} loading />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });
});
