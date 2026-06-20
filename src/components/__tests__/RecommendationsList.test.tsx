import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { RecommendationsList } from "../ai/RecommendationsList";

beforeEach(() => vi.clearAllMocks());

describe("RecommendationsList", () => {
  it("renders nothing when there are no items", async () => {
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));
    const { container } = render(<RecommendationsList />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("renders titles and CTAs", async () => {
    (supabase.from as any) = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { id: "r1", title: "Try cycling", description: "Save 2kg", impact: "-10%", cta_link: "/tracking", cta_label: "Log a trip", is_global: false },
        ],
        error: null,
      }),
    }));
    render(<RecommendationsList />);
    await waitFor(() => expect(screen.getByText("Try cycling")).toBeInTheDocument());
    expect(screen.getByText(/Log a trip/)).toBeInTheDocument();
    expect(screen.getByText("-10%")).toBeInTheDocument();
  });
});
