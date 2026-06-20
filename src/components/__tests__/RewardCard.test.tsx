import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RewardCard } from "../cards/RewardCard";

const base = { title: "Coffee", brand: "Cafe", cost: 100 };

describe("RewardCard", () => {
  it("renders title and brand", () => {
    render(<RewardCard {...base} />);
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("Cafe")).toBeInTheDocument();
  });
  it("shows the points needed when not affordable", () => {
    render(<RewardCard {...base} balance={20} />);
    expect(screen.getByText(/need 80 more/)).toBeInTheDocument();
  });
  it("is clickable when affordable", () => {
    const onClick = vi.fn();
    render(<RewardCard {...base} balance={500} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
  it("is disabled and shows sold out when stock is 0", () => {
    render(<RewardCard {...base} remainingStock={0} />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText(/sold out/i)).toBeInTheDocument();
  });
  it("warns when low stock", () => {
    render(<RewardCard {...base} balance={500} remainingStock={3} />);
    expect(screen.getByText(/Only 3 left/i)).toBeInTheDocument();
  });
  it("renders image when imageUrl provided", () => {
    render(<RewardCard {...base} imageUrl="/x.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Coffee");
  });
});
