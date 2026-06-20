import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Leaf } from "lucide-react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByRole("heading", { name: "No data" })).toBeInTheDocument();
  });
  it("renders description and action when provided", () => {
    render(<EmptyState title="t" description="d" action={<button>go</button>} icon={Leaf} />);
    expect(screen.getByText("d")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "go" })).toBeInTheDocument();
  });
  it("omits description when not provided", () => {
    const { container } = render(<EmptyState title="only" />);
    expect(container.querySelector("p")).toBeNull();
  });
});
