import { describe, it, expect } from "vitest";
import {
  dropSpeedWpm,
  spawnIntervalSeconds,
  fallDurationSeconds,
  stackWouldLose,
  START_SPEED_WPM,
  SPEED_ACCELERATION,
  MAX_SPEED_WPM,
  MAX_FALL_SECONDS,
  MIN_FALL_SECONDS,
  MAX_STACK_SIZE,
  LOSE_STACK_SIZE,
} from "./wordDropEngine";

describe("dropSpeedWpm", () => {
  it("starts at the baseline speed", () => {
    expect(dropSpeedWpm(0)).toBe(START_SPEED_WPM);
  });

  it("accelerates linearly over time", () => {
    expect(dropSpeedWpm(10)).toBe(START_SPEED_WPM + SPEED_ACCELERATION * 10);
  });

  it("caps at the maximum speed", () => {
    expect(dropSpeedWpm(1_000_000)).toBe(MAX_SPEED_WPM);
  });
});

describe("spawnIntervalSeconds", () => {
  it("yields one word per six seconds at the baseline", () => {
    expect(spawnIntervalSeconds(0)).toBe(60 / START_SPEED_WPM);
  });

  it("shortens as the game speeds up", () => {
    expect(spawnIntervalSeconds(30)).toBeLessThan(spawnIntervalSeconds(0));
  });
});

describe("stackWouldLose", () => {
  it("returns true once a fourth word would stack", () => {
    expect(stackWouldLose(LOSE_STACK_SIZE)).toBe(true);
    expect(stackWouldLose(LOSE_STACK_SIZE + 1)).toBe(true);
  });

  it("returns false within the safe stack size", () => {
    expect(stackWouldLose(MAX_STACK_SIZE)).toBe(false);
    expect(stackWouldLose(1)).toBe(false);
  });
});

describe("fallDurationSeconds", () => {
  it("starts gradual at the slowest speed", () => {
    expect(fallDurationSeconds(0)).toBeCloseTo(MAX_FALL_SECONDS);
  });

  it("shortens as the game speeds up", () => {
    expect(fallDurationSeconds(120)).toBeLessThan(fallDurationSeconds(0));
  });

  it("bottoms out at the minimum duration at top speed", () => {
    expect(fallDurationSeconds(1_000_000)).toBeCloseTo(MIN_FALL_SECONDS);
  });
});
