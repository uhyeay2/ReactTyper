import { describe, it, expect } from "vitest";
import { calculateAverageWpm } from "../utils/calculateAverageWpm";
import type { WpmTimelinePoint } from "../metrics/wpm";

function point(second: number, wpm: number): WpmTimelinePoint {
  return { second, wpm, words: [] };
}

describe("calculateAverageWpm", () => {
  it("returns zero for an empty timeline", () => {
    expect(calculateAverageWpm([])).toBe(0);
  });

  it("returns zero when every point is zero", () => {
    expect(calculateAverageWpm([point(1, 0), point(2, 0)])).toBe(0);
  });

  it("averages the positive points", () => {
    expect(
      calculateAverageWpm([
        point(1, 40),
        point(2, 65),
        point(3, 55),
        point(4, 80),
      ]),
    ).toBe(60);
  });

  it("ignores zero points when averaging", () => {
    expect(calculateAverageWpm([point(1, 0), point(2, 45), point(3, 60)])).toBe(
      53,
    );
  });

  it("rounds fractional averages to the nearest whole number", () => {
    expect(calculateAverageWpm([point(1, 10), point(2, 21)])).toBe(16);
  });

  it("returns the single point value for a one-point timeline", () => {
    expect(calculateAverageWpm([point(1, 50)])).toBe(50);
  });
});