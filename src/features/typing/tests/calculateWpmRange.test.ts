import { describe, it, expect } from "vitest";
import { calculateWpmRange } from "../utils/calculateWpmRange";
import type { WpmTimelinePoint } from "../metrics/wpm";

function point(second: number, wpm: number): WpmTimelinePoint {
  return { second, wpm, words: [] };
}

describe("calculateWpmRange", () => {
  it("returns zero for an empty timeline", () => {
    expect(calculateWpmRange([])).toEqual({ highest: 0, lowest: 0 });
  });

  it("returns zero when every point is zero", () => {
    expect(
      calculateWpmRange([point(1, 0), point(2, 0)]),
    ).toEqual({ highest: 0, lowest: 0 });
  });

  it("finds the highest and lowest positive points", () => {
    expect(
      calculateWpmRange([
        point(1, 40),
        point(2, 65),
        point(3, 55),
        point(4, 80),
      ]),
    ).toEqual({ highest: 80, lowest: 40 });
  });

  it("ignores zero points when finding the lowest", () => {
    expect(
      calculateWpmRange([point(1, 0), point(2, 45), point(3, 60)]),
    ).toEqual({ highest: 60, lowest: 45 });
  });

  it("returns the same value for highest and lowest with one point", () => {
    expect(calculateWpmRange([point(1, 50)])).toEqual({
      highest: 50,
      lowest: 50,
    });
  });
});