import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Leaf } from "lucide-react";
import { StatCard } from "../cards/StatCard";

describe("StatCard", () => {
  it("renders label, value, unit, and trend", () => {
    render(<StatCard label="CO2" value={12.5} unit="kg" trend="-5% vs last week" icon={Leaf} />);
    expect(screen.getByText("CO2")).toBeInTheDocument();
    expect(screen.getByText("12.5")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByText("-5% vs last week")).toBeInTheDocument();
  });
  it("supports string values", () => {
    render(<StatCard label="rank" value="#42" />);
    expect(screen.getByText("#42")).toBeInTheDocument();
  });
  it("applies success accent class", () => {
    const { container } = render(<StatCard label="x" value={1} icon={Leaf} accent="success" />);
    expect(container.innerHTML).toContain("var(--success)");
  });
});
