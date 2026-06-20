import { describe, it, expect } from "vitest";
import {
  TRUST_LEVELS,
  levelFromScore,
} from "../use-trust";

describe("levelFromScore", () => {
  it("classifies eco_leader at ≥90", () => {
    expect(levelFromScore(95)).toBe("eco_leader");
    expect(levelFromScore(90)).toBe("eco_leader");
  });
  it("classifies trusted in [70, 90)", () => {
    expect(levelFromScore(89)).toBe("trusted");
    expect(levelFromScore(70)).toBe("trusted");
  });
  it("classifies standard in [50, 70)", () => {
    expect(levelFromScore(69)).toBe("standard");
    expect(levelFromScore(50)).toBe("standard");
  });
  it("classifies needs_verification below 50", () => {
    expect(levelFromScore(49)).toBe("needs_verification");
    expect(levelFromScore(0)).toBe("needs_verification");
  });
  it("exposes labels for every level", () => {
    for (const lvl of ["eco_leader", "trusted", "standard", "needs_verification"] as const) {
      expect(TRUST_LEVELS[lvl].label).toBeTruthy();
      expect(typeof TRUST_LEVELS[lvl].min).toBe("number");
    }
  });
});
