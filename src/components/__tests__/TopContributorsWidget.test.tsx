import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { TopContributorsWidget } from "../community/TopContributorsWidget";

beforeEach(() => vi.clearAllMocks());

describe("TopContributorsWidget", () => {
  it("renders nothing when there are no contributors", async () => {
    (supabase.rpc as any) = vi.fn().mockResolvedValue({ data: [], error: null });
    const { container } = render(<TopContributorsWidget />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("renders the contributor list", async () => {
    (supabase.rpc as any) = vi.fn().mockResolvedValue({
      data: [
        { user_id: "1", name: "Alice", photo: null, posts: 10, likes_received: 50, green_points: 1000 },
        { user_id: "2", name: "Bob",   photo: null, posts: 5,  likes_received: 30, green_points: 500 },
      ],
      error: null,
    });
    render(<TopContributorsWidget />);
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText(/Top contributors/i)).toBeInTheDocument();
  });
});
