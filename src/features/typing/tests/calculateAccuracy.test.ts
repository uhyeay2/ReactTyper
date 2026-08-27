import { describe, it, expect } from "vitest";
import { calculateAccuracy } from "../utils/calculateAccuracy";

describe("calculateAccuracy", () => {
  it("returns 0 when total chars is 0", () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  it("returns 100 for perfect accuracy", () => {
    expect(calculateAccuracy(100, 100)).toBe(100);
  });

  it("returns 0 when no correct chars", () => {
    expect(calculateAccuracy(0, 50)).toBe(0);
  });

  it("calculates correct percentage", () => {
    expect(calculateAccuracy(95, 100)).toBe(95);
  });

  it("rounds to nearest integer", () => {
    expect(calculateAccuracy(1, 3)).toBe(33);
  });

  it("handles large numbers", () => {
    expect(calculateAccuracy(999, 1000)).toBe(100);
  });
});
