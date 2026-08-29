import { describe, it, expect } from "vitest";
import { computeBackspaceBoundary } from "../utils/backspaceBoundary";

describe("computeBackspaceBoundary", () => {
  it("returns 0 for empty text", () => {
    expect(computeBackspaceBoundary("")).toBe(0);
  });

  it("returns 0 for a single word", () => {
    expect(computeBackspaceBoundary("word1")).toBe(0);
  });

  it("returns 0 for a word plus a trailing space", () => {
    expect(computeBackspaceBoundary("word1 ")).toBe(0);
  });

  it("returns 0 for exactly two words", () => {
    expect(computeBackspaceBoundary("word1 word2")).toBe(0);
  });

  it("keeps the word before the last two when three words are typed", () => {
    expect(computeBackspaceBoundary("word1 word2 word3")).toBe(
      "word1".length,
    );
  });

  it("keeps the word before the last two for a partial current word", () => {
    expect(computeBackspaceBoundary("word1 word2 word3 wor")).toBe(
      "word1 word2".length,
    );
  });

  it("keeps the word before the last two when the current word is empty", () => {
    expect(computeBackspaceBoundary("word1 word2 word3 ")).toBe(
      "word1 word2".length,
    );
  });

  it("keeps the word before the last two for a five word text", () => {
    expect(computeBackspaceBoundary("a b c d e")).toBe("a b c".length);
  });
});