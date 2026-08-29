import { describe, it, expect } from "vitest";
import {
  calculateWordStats,
  countWordsWithErrors,
} from "../utils/calculateWordStats";

describe("calculateWordStats", () => {
  it("categorizes all perfect words", () => {
    expect(calculateWordStats("cat dog", "cat dog", "0000000")).toEqual({
      totalWordsTyped: 2,
      wordsTypedWithErrors: 0,
      wordsTypedWithCorrections: 0,
      wordsTypedPerfectly: 2,
    });
  });

  it("categorizes words with a remaining error", () => {
    expect(calculateWordStats("cat dog", "cat xog", "0000000")).toEqual({
      totalWordsTyped: 2,
      wordsTypedWithErrors: 1,
      wordsTypedWithCorrections: 0,
      wordsTypedPerfectly: 1,
    });
  });

  it("categorizes words with corrections", () => {
    expect(calculateWordStats("cat dog", "cat dog", "0100000")).toEqual({
      totalWordsTyped: 2,
      wordsTypedWithErrors: 0,
      wordsTypedWithCorrections: 1,
      wordsTypedPerfectly: 1,
    });
  });

  it("prioritizes a remaining error in a word that also has corrections", () => {
    expect(calculateWordStats("abcdef", "abxdef", "001000")).toEqual({
      totalWordsTyped: 1,
      wordsTypedWithErrors: 1,
      wordsTypedWithCorrections: 0,
      wordsTypedPerfectly: 0,
    });
  });

  it("counts a trailing partial word", () => {
    expect(calculateWordStats("hello world", "hel", "000")).toEqual({
      totalWordsTyped: 1,
      wordsTypedWithErrors: 0,
      wordsTypedWithCorrections: 0,
      wordsTypedPerfectly: 1,
    });
  });

  it("returns zero totals when nothing is typed", () => {
    expect(calculateWordStats("hello", "", "")).toEqual({
      totalWordsTyped: 0,
      wordsTypedWithErrors: 0,
      wordsTypedWithCorrections: 0,
      wordsTypedPerfectly: 0,
    });
  });
});

describe("countWordsWithErrors", () => {
  it("returns 0 when every word is typed perfectly", () => {
    expect(countWordsWithErrors("hello world", "hello world", "00000000000")).toBe(
      0,
    );
  });

  it("counts target words containing a remaining mismatch", () => {
    expect(countWordsWithErrors("aaa bbb", "axa byb", "0000000")).toBe(2);
  });

  it("counts target words that were corrected", () => {
    expect(countWordsWithErrors("aaa bbb", "aaa bbb", "0100000")).toBe(1);
  });

  it("ignores a trailing partial word without errors", () => {
    expect(countWordsWithErrors("hello world", "hel", "")).toBe(0);
  });

  it("counts an errored trailing partial word", () => {
    expect(countWordsWithErrors("hello world", "hxl", "000")).toBe(1);
  });
});