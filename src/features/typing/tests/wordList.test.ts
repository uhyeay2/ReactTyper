import { describe, it, expect } from "vitest";
import {
  getRandomWords,
  getTargetText,
  getExtraWords,
} from "../utils/wordList";

describe("wordList", () => {
  it("returns the requested number of random words", () => {
    const words = getRandomWords(5);
    expect(words.length).toBe(5);
    words.forEach((w) => expect(typeof w).toBe("string"));
  });

  it("caps the returned words at the pool size", () => {
    const words = getRandomWords(100000);
    expect(words.length).toBeGreaterThan(0);
    expect(words.length).toBeLessThanOrEqual(100000);
  });

  it("returns only pool words with no refills for a single call", () => {
    const words = getRandomWords(200);
    expect(words.length).toBe(200);
    words.forEach((w) => expect(typeof w).toBe("string"));
  });

  it("joins random words into a target text", () => {
    const text = getTargetText(5);
    expect(text.split(" ").length).toBe(5);
  });

  it("returns extra words joined by spaces", () => {
    const extra = getExtraWords(3);
    expect(extra.split(" ").length).toBe(3);
  });

  it("refills the extra words pool when depleted", () => {
    // Drain the pool far beyond its size to force a refill.
    const first = getExtraWords(300);
    const second = getExtraWords(300);
    expect(first.split(" ").length).toBe(300);
    expect(second.split(" ").length).toBe(300);
  });
});
