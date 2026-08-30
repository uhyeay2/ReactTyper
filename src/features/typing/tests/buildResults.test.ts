import { describe, it, expect } from "vitest";
import { buildResults } from "../utils/buildResults";
import type { Keystroke, WpmTimelinePoint } from "../metrics/wpm";

function keystrokesFor(text: string): Keystroke[] {
  return Array.from({ length: text.length }, (_, i) => ({
    timestamp: i * 50,
    charIndex: i,
  }));
}

describe("buildResults", () => {
  it("computes gross, net, and accuracy from the input", () => {
    const recordedTimeline: WpmTimelinePoint[] = [
      { second: 1, wpm: 10, words: [] },
    ];

    const { results, wpmTimeline } = buildResults({
      typedText: "aaaab",
      targetText: "aaaaa",
      totalTyped: 5,
      correctChars: 4,
      elapsedTime: 60,
      fixedChars: "",
      keystrokes: keystrokesFor("aaaab"),
      recordedTimeline,
    });

    expect(results.wpm).toBe(0);
    expect(results.grossWpm).toBe(1);
    expect(results.accuracy).toBe(80);
    expect(results.correctChars).toBe(4);
    expect(results.elapsedTime).toBe(60);
    expect(results.totalWordsTyped).toBe(1);
    expect(results.wordsTypedWithErrors).toBe(1);
    expect(results.wordsTypedWithCorrections).toBe(0);
    expect(results.wordsTypedPerfectly).toBe(0);
    expect(results.highestWpm).toBe(10);
    expect(results.lowestWpm).toBe(10);
    expect(results.averageWpm).toBe(10);
    expect(results.incorrectChars).toBe(1);
    expect(results.charStates).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "incorrect",
    ]);

    expect(wpmTimeline).toEqual([
      { second: 1, wpm: 10, words: ["aaaab"] },
    ]);
    expect(results.wordStates).toEqual([
      {
        wordText: "aaaab",
        startCharIndex: 0,
        endCharIndex: 4,
        second: 1,
        wpm: 10,
      },
    ]);
  });

  it("returns zero WPM when no time has elapsed", () => {
    const { results } = buildResults({
      typedText: "aaaab",
      targetText: "aaaaa",
      totalTyped: 5,
      correctChars: 4,
      elapsedTime: 0,
      fixedChars: "",
      keystrokes: keystrokesFor("aaaab"),
      recordedTimeline: [
        { second: 1, wpm: 10, words: [] },
      ],
    });

    expect(results.wpm).toBe(0);
    expect(results.grossWpm).toBe(0);
    expect(results.accuracy).toBe(80);
  });

  it("counts corrected words in incorrectChars without counting them as errors", () => {
    const { results } = buildResults({
      typedText: "aaaaa",
      targetText: "aaaaa",
      totalTyped: 5,
      correctChars: 5,
      elapsedTime: 60,
      fixedChars: "10000",
      keystrokes: keystrokesFor("aaaaa"),
      recordedTimeline: [
        { second: 1, wpm: 12, words: [] },
      ],
    });

    expect(results.wordsTypedWithErrors).toBe(0);
    expect(results.wordsTypedWithCorrections).toBe(1);
    expect(results.wordsTypedPerfectly).toBe(0);
    expect(results.incorrectChars).toBe(1);
    expect(results.charStates).toEqual([
      "fixed",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("backfills leading zero timeline points before measuring the range", () => {
    const recordedTimeline: WpmTimelinePoint[] = [
      { second: 1, wpm: 0, words: [] },
      { second: 2, wpm: 60, words: [] },
      { second: 3, wpm: 30, words: [] },
    ];

    const { results, wpmTimeline } = buildResults({
      typedText: "a",
      targetText: "a",
      totalTyped: 1,
      correctChars: 1,
      elapsedTime: 2,
      fixedChars: "",
      keystrokes: [{ timestamp: 0, charIndex: 0 }],
      recordedTimeline,
    });

    expect(wpmTimeline[0]).toEqual({ second: 1, wpm: 60, words: ["a"] });
    expect(results.highestWpm).toBe(60);
    expect(results.lowestWpm).toBe(30);
    expect(results.averageWpm).toBe(50);
  });

  it("builds word states for multi-word typed text", () => {
    const typed = "cat dog";
    const { results } = buildResults({
      typedText: typed,
      targetText: "cat dog",
      totalTyped: 7,
      correctChars: 7,
      elapsedTime: 60,
      fixedChars: "",
      keystrokes: keystrokesFor(typed),
      recordedTimeline: [
        { second: 1, wpm: 10, words: [] },
        { second: 2, wpm: 20, words: [] },
      ],
    });

    expect(results.totalWordsTyped).toBe(2);
    expect(results.wordStates.map((state) => state.wordText)).toEqual([
      "cat",
      "dog",
    ]);
  });
});