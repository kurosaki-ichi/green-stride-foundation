import { describe, it, expect } from "vitest";
import { percentile, percentileLabel } from "../use-rankings";

describe("percentile", () => {
  it("returns null when rank or total is missing", () => {
    expect(percentile(null, 100)).toBeNull();
    expect(percentile(5, null)).toBeNull();
    expect(percentile(undefined, undefined)).toBeNull();
  });
  it("computes a 1-100 percentile", () => {
    expect(percentile(1, 100)).toBe(1);
    expect(percentile(50, 100)).toBe(50);
    expect(percentile(100, 100)).toBe(100);
  });
  it("never returns 0", () => {
    expect(percentile(0, 100)).toBeNull(); // rank 0 is falsy
    expect(percentile(1, 10000)).toBeGreaterThanOrEqual(1);
  });
});

describe("percentileLabel", () => {
  it("returns null when input is null", () => {
    expect(percentileLabel(null)).toBeNull();
  });
  it("buckets correctly", () => {
    expect(percentileLabel(3)).toBe("Top 5%");
    expect(percentileLabel(8)).toBe("Top 10%");
    expect(percentileLabel(20)).toBe("Top 25%");
    expect(percentileLabel(40)).toBe("Top 50%");
    expect(percentileLabel(80)).toBe("Top 80%");
  });
});
