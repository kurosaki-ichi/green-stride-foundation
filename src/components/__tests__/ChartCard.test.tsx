import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartCard } from "../cards/ChartCard";

describe("ChartCard", () => {
  it("renders title and children", () => {
    render(<ChartCard title="Emissions"><div>chart</div></ChartCard>);
    expect(screen.getByRole("heading", { name: "Emissions" })).toBeInTheDocument();
    expect(screen.getByText("chart")).toBeInTheDocument();
  });
  it("renders description and action", () => {
    render(<ChartCard title="t" description="d" action={<button>a</button>}>x</ChartCard>);
    expect(screen.getByText("d")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "a" })).toBeInTheDocument();
  });
});
