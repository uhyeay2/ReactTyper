import { describe, it, expect } from "vitest";
import {
  classifyWordQuality,
  computeWordScore,
  computeAccuracy,
  SCORE_PERFECT_WORD,
  SCORE_CORRECTED_WORD,
  SCORE_ERRORED_WORD,
  MAX_SPEED_BONUS,
} from "./scoring";

describe("classifyWordQuality", () => {
  it("classifies a clean word as perfect", () => {
    expect(classifyWordQuality(false, false)).toBe("perfect");
  });

  it("classifies a corrected word as corrected", () => {
    expect(classifyWordQuality(false, true)).toBe("corrected");
  });

  it("classifies a word with an error as errored regardless of correction", () => {
    expect(classifyWordQuality(true, true)).toBe("errored");
    expect(classifyWordQuality(true, false)).toBe("errored");
  });
});

describe("computeWordScore", () => {
  it("gives the base score plus a speed bonus", () => {
    const result = computeWordScore("perfect", 40);
    expect(result.points).toBe(SCORE_PERFECT_WORD);
    expect(result.speedBonus).toBe(20);
    expect(result.total).toBe(SCORE_PERFECT_WORD + 20);
  });

  it("applies the lower base values for corrected and errored words", () => {
    expect(computeWordScore("corrected", 0).points).toBe(SCORE_CORRECTED_WORD);
    expect(computeWordScore("errored", 0).points).toBe(SCORE_ERRORED_WORD);
  });

  it("caps the speed bonus at the maximum", () => {
    const result = computeWordScore("perfect", 1000);
    expect(result.speedBonus).toBe(MAX_SPEED_BONUS);
  });

  it("never yields a negative speed bonus", () => {
    const result = computeWordScore("perfect", -50);
    expect(result.speedBonus).toBe(0);
  });
});

describe("computeAccuracy", () => {
  it("computes a correct percentage rounded", () => {
    expect(computeAccuracy(90, 10)).toBe(90);
  });

  it("returns 100 when nothing was typed", () => {
    expect(computeAccuracy(0, 0)).toBe(100);
  });
});
