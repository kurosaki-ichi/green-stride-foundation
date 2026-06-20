import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletCard } from "../cards/WalletCard";

const wallet: any = { balance: 1234, lifetime_earned: 5000, month_earned: 200, lifetime_spent: 900 };

describe("WalletCard", () => {
  it("renders zero balance when wallet is null", () => {
    render(<WalletCard wallet={null} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
  it("renders formatted balance and mini stats", () => {
    render(<WalletCard wallet={wallet} />);
    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
  });
  it("includes the green wallet label", () => {
    render(<WalletCard wallet={wallet} />);
    expect(screen.getByText(/Green wallet/i)).toBeInTheDocument();
  });
});
