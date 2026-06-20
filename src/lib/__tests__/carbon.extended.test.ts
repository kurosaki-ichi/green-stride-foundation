import { describe, it, expect } from "vitest";
import { calcCo2, EMISSION_FACTORS } from "../carbon";

describe("calcCo2 — extended cases", () => {
  it("EV emits more than zero per km but less than car", () => {
    const ev = calcCo2("ev", 10).generated;
    const car = calcCo2("car", 10).generated;
    expect(ev).toBeGreaterThan(0);
    expect(ev).toBeLessThan(car);
  });

  it("auto rickshaw saves vs car", () => {
    expect(calcCo2("auto", 10).saved).toBeGreaterThan(0);
  });

  it("bike vs cycle: bike emits, cycle does not", () => {
    expect(calcCo2("bike", 10).generated).toBeGreaterThan(0);
    expect(calcCo2("cycle", 10).generated).toBe(0);
  });

  it("rounds to 3 decimal places", () => {
    const r = calcCo2("car", 1 / 3);
    expect(Number.isInteger(r.generated * 1000)).toBe(true);
  });

  it("handles large distances without overflow", () => {
    const r = calcCo2("car", 100000);
    expect(r.generated).toBe(+(EMISSION_FACTORS.car * 100000).toFixed(3));
  });
});
