import { describe, it, expect } from "vitest";
import { formatConfigSummary } from "../utils/formatConfigSummary";

describe("formatConfigSummary", () => {
  it("returns Zen Mode when zen mode is active", () => {
    expect(formatConfigSummary(true, null, null, null, null)).toBe("Zen Mode");
  });

  it("returns a single time limit", () => {
    expect(formatConfigSummary(false, 60, null, null, null)).toBe(
      "1m Time Limit",
    );
  });

  it("combines time and word limits", () => {
    expect(formatConfigSummary(false, 60, 50, null, null)).toBe(
      "1m Time Limit \u00b7 50 Word Limit",
    );
  });

  it("combines word and error limits", () => {
    expect(formatConfigSummary(false, null, 50, 3, null)).toBe(
      "50 Word Limit \u00b7 3 Max Errors",
    );
  });

  it("combines all three limits", () => {
    expect(formatConfigSummary(false, 60, 50, 3, null)).toBe(
      "1m Time Limit \u00b7 50 Word Limit \u00b7 3 Max Errors",
    );
  });

  it("formats sub-minute durations in seconds", () => {
    expect(formatConfigSummary(false, 30, null, null, null)).toBe(
      "30s Time Limit",
    );
  });

  it("formats multi-minute durations", () => {
    expect(formatConfigSummary(false, 300, null, null, null)).toBe(
      "5m Time Limit",
    );
  });

  it("formats minutes and remaining seconds", () => {
    expect(formatConfigSummary(false, 90, null, null, null)).toBe(
      "1m 30s Time Limit",
    );
  });

  it("formats a single max errors value", () => {
    expect(formatConfigSummary(false, null, null, 1, null)).toBe(
      "1 Max Errors",
    );
  });

  it("returns No limits when no limits are configured", () => {
    expect(formatConfigSummary(false, null, null, null, null)).toBe(
      "No limits",
    );
  });

  it("appends the word bank label to a non-zen summary", () => {
    expect(formatConfigSummary(false, 60, null, null, "english-top-200")).toBe(
      "1m Time Limit \u00b7 English Top 200",
    );
  });

  it("appends the word bank label to a zen summary", () => {
    expect(formatConfigSummary(true, null, null, null, "english-top-50")).toBe(
      "Zen Mode \u00b7 English Top 50",
    );
  });
});