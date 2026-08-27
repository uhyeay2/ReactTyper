import { describe, it, expect } from "vitest";
import {
  calculateGrossWpm,
  calculateNetWpm,
} from "../utils/calculateWpm";

describe("calculateGrossWpm", () => {
  it("returns 0 when elapsed minutes is 0", () => {
    expect(calculateGrossWpm(250, 0)).toBe(0);
  });

  it("returns 0 when characters typed is 0", () => {
    expect(calculateGrossWpm(0, 1)).toBe(0);
  });

  it("calculates correct WPM for 250 characters in 1 minute", () => {
    expect(calculateGrossWpm(250, 1)).toBe(50);
  });

  it("calculates correct WPM for 500 characters in 2 minutes", () => {
    expect(calculateGrossWpm(500, 2)).toBe(50);
  });

  it("floors the result to integer", () => {
    expect(calculateGrossWpm(120, 1)).toBe(24);
  });

  it("handles fractional minutes", () => {
    expect(calculateGrossWpm(250, 0.5)).toBe(100);
  });
});

describe("calculateNetWpm", () => {
  it("returns 0 when elapsed minutes is 0", () => {
    expect(calculateNetWpm(50, 5, 0)).toBe(0);
  });

  it("subtracts error rate from gross WPM", () => {
    expect(calculateNetWpm(60, 5, 1)).toBe(55);
  });

  it("returns 0 when errors exceed gross WPM", () => {
    expect(calculateNetWpm(10, 20, 1)).toBe(0);
  });

  it("handles fractional minutes", () => {
    expect(calculateNetWpm(80, 4, 2)).toBe(78);
  });

  it("returns same as gross when no errors", () => {
    expect(calculateNetWpm(50, 0, 1)).toBe(50);
  });
});
