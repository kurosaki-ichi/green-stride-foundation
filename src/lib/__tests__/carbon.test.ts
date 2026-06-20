import { describe, it, expect } from "vitest";
import { calcCo2, EMISSION_FACTORS, TRANSPORT_LABELS } from "../carbon";

describe("calcCo2", () => {
  it("returns zero generated and saved for zero distance", () => {
    expect(calcCo2("car", 0)).toEqual({ generated: 0, saved: 0 });
  });
  it("computes generated emissions for a car trip", () => {
    const r = calcCo2("car", 10);
    expect(r.generated).toBeCloseTo(EMISSION_FACTORS.car * 10, 3);
    expect(r.saved).toBe(0);
  });
  it("walking generates zero and saves the car baseline", () => {
    const r = calcCo2("walk", 5);
    expect(r.generated).toBe(0);
    expect(r.saved).toBeCloseTo(EMISSION_FACTORS.car * 5, 3);
  });
  it("metro saves vs car baseline", () => {
    const r = calcCo2("metro", 20);
    expect(r.saved).toBeGreaterThan(0);
    expect(r.generated).toBeGreaterThan(0);
  });
  it("never produces negative saved values", () => {
    expect(calcCo2("car", 100).saved).toBeGreaterThanOrEqual(0);
  });
  it("returns labels for all transport modes", () => {
    for (const k of Object.keys(EMISSION_FACTORS)) {
      expect(TRANSPORT_LABELS[k as keyof typeof TRANSPORT_LABELS]).toBeTruthy();
    }
  });
});
