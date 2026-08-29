import { describe, it, expect } from "vitest";
import { computeCumulativeWpm, CHARS_PER_WORD } from "./cumulativeWpm";

function snapshots(
  totalTypedPerSecond: number[],
  errors: number[] = totalTypedPerSecond.map(() => 0),
): Array<{ second: number; totalTyped: number; errors: number }> {
  return totalTypedPerSecond.map((totalTyped, i) => ({
    second: i + 1,
    totalTyped,
    errors: errors[i] ?? 0,
  }));
}

describe("computeCumulativeWpm", () => {
  it("returns an empty array for no snapshots", () => {
    expect(computeCumulativeWpm([])).toEqual([]);
  });

  it("computes cumulative gross WPM for a steady session", () => {
    const points = computeCumulativeWpm(snapshots([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]));
    expect(points.length).toBe(10);
    expect(points[0]).toEqual({ second: 1, wpm: 60 });
    expect(points[1]).toEqual({ second: 2, wpm: 60 });
    expect(points[4]).toEqual({ second: 5, wpm: 60 });
    expect(points[9]).toEqual({ second: 10, wpm: 60 });
  });

  it("reflects the cumulative average, which decays after an early burst", () => {
    const points = computeCumulativeWpm(snapshots([17, 27, 36, 45, 54, 63, 72, 81, 90, 99]));
    expect(points[0]).toEqual({ second: 1, wpm: 204 });
    expect(points[1]).toEqual({ second: 2, wpm: 162 });
    expect(points[2]).toEqual({ second: 3, wpm: 144 });
    expect(points[4]).toEqual({ second: 5, wpm: 129 });
  });

  it("starts the series at one second and skips a zero-second snapshot", () => {
    const points = computeCumulativeWpm([
      { second: 0, totalTyped: 0, errors: 0 },
      { second: 1, totalTyped: 5, errors: 0 },
      { second: 2, totalTyped: 10, errors: 0 },
    ]);
    expect(points.length).toBe(2);
    expect(points[0]).toEqual({ second: 1, wpm: 60 });
  });

  it("reports gross WPM without penalizing for errors", () => {
    const points = computeCumulativeWpm(
      snapshots(
        [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 400],
      ),
    );
    expect(points[9]).toEqual({ second: 10, wpm: 60 });
  });

  it("never returns a negative WPM", () => {
    const points = computeCumulativeWpm(
      snapshots([-5, 0, 5, 10, 15, 20, 25, 30, 35, 40]),
    );
    for (const point of points) {
      expect(point.wpm).toBeGreaterThanOrEqual(0);
    }
  });

  it("exposes the characters-per-word constant", () => {
    expect(CHARS_PER_WORD).toBe(5);
  });
});
