import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { ForecastCard } from "../ai/ForecastCard";

beforeEach(() => vi.clearAllMocks());

describe("ForecastCard", () => {
  it("renders horizon buttons and a loading placeholder", async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: null } });
    render(<ForecastCard />);
    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(screen.getByText("30 days")).toBeInTheDocument();
    expect(screen.getByText("90 days")).toBeInTheDocument();
    expect(screen.getByText("1 year")).toBeInTheDocument();
  });

  it("renders forecast values when data is returned", async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } });
    (supabase.rpc as any) = vi.fn().mockResolvedValue({
      data: [{ current_co2: 100, predicted_co2: 120, recommended_co2: 80, potential_reduction: 40 }],
      error: null,
    });
    render(<ForecastCard />);
    await waitFor(() => expect(screen.getByText(/120.0 kg/)).toBeInTheDocument());
    expect(screen.getByText(/80.0 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Potential reduction/i)).toBeInTheDocument();
  });

  it("switching horizons re-fetches", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } });
    (supabase.rpc as any) = rpc;
    render(<ForecastCard />);
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    fireEvent.click(screen.getByText("90 days"));
    await waitFor(() => expect(rpc.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
