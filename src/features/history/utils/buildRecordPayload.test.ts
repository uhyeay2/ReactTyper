import { describe, it, expect } from "vitest";
import type { TypingResults } from "@/features/typing/state/typingTypes";
import type { WpmTimelinePoint } from "@/features/typing/metrics/wpm";
import { buildRecordPayload } from "./buildRecordPayload";

const results: TypingResults = {
  wpm: 65.4,
  grossWpm: 70.2,
  accuracy: 92.5,
  correctChars: 20,
  incorrectChars: 3,
  elapsedTime: 12,
  totalWordsTyped: 3,
  wordsTypedWithErrors: 1,
  wordsTypedWithCorrections: 1,
  wordsTypedPerfectly: 1,
  highestWpm: 72.6,
  lowestWpm: 55.8,
  averageWpm: 63.1,
  wordStates: [
    { wordText: "cat", startCharIndex: 0, endCharIndex: 2, second: 1, wpm: 66 },
    { wordText: "dog", startCharIndex: 4, endCharIndex: 6, second: 2, wpm: 70 },
  ],
  charStates: [
    "correct",
    "fixed",
    "correct",
    "correct",
    "incorrect",
    "correct",
    "correct",
  ],
};

const wpmTimeline: WpmTimelinePoint[] = [
  { second: 1, wpm: 66, words: ["cat"] },
  { second: 2, wpm: 70, words: ["dog"] },
];

describe("buildRecordPayload", () => {
  it("persists the metrics with the same shape as the live results", () => {
    const payload = buildRecordPayload({
      results,
      sessionContext: {
        sessionType: 0,
        lessonSlug: "lesson-1",
        lessonUnitOrder: 2,
        wordBankSlug: null,
      },
      config: { duration: 60, wordCount: null, maxErrors: 5, isZenMode: false },
      targetWordCount: 25,
      wpmTimeline,
    });

    expect(payload.wpm).toBe(65);
    expect(payload.rawWpm).toBe(70);
    expect(payload.accuracy).toBe(92.5);
    expect(payload.correctCharacterCount).toBe(20);
    expect(payload.incorrectCharacterCount).toBe(3);
    expect(payload.durationSeconds).toBe(12);
    expect(payload.wordCount).toBe(25);
    expect(payload.totalWordsTyped).toBe(3);
    expect(payload.wordsTypedWithErrors).toBe(1);
    expect(payload.wordsTypedWithCorrections).toBe(1);
    expect(payload.wordsTypedPerfectly).toBe(1);
    expect(payload.highestWpm).toBe(73);
    expect(payload.lowestWpm).toBe(56);
    expect(payload.averageWpm).toBe(63);
    expect(payload.durationLimitSeconds).toBe(60);
    expect(payload.maxWords).toBeNull();
    expect(payload.maxErrors).toBe(5);
    expect(payload.isZenMode).toBe(false);
  });

  it("slices the per-word character states so history colors match live", () => {
    const payload = buildRecordPayload({
      results,
      sessionContext: {
        sessionType: 0,
        lessonSlug: null,
        lessonUnitOrder: null,
        wordBankSlug: null,
      },
      config: { duration: null, wordCount: null, maxErrors: null, isZenMode: false },
      targetWordCount: 25,
      wpmTimeline,
    });

    expect(payload.typedWords).toEqual([
      {
        wordText: "cat",
        second: 1,
        wpm: 66,
        charStates: ["correct", "fixed", "correct"],
      },
      {
        wordText: "dog",
        second: 2,
        wpm: 70,
        charStates: ["incorrect", "correct", "correct"],
      },
    ]);
  });

  it("drops per-second words from the timeline points", () => {
    const payload = buildRecordPayload({
      results,
      sessionContext: {
        sessionType: 0,
        lessonSlug: null,
        lessonUnitOrder: null,
        wordBankSlug: null,
      },
      config: { duration: null, wordCount: null, maxErrors: null, isZenMode: true },
      targetWordCount: 25,
      wpmTimeline,
    });

    expect(payload.wpmTimeline).toEqual([
      { second: 1, wpm: 66 },
      { second: 2, wpm: 70 },
    ]);
    expect(payload.isZenMode).toBe(true);
  });

  it("uses the configured word count when present", () => {
    const payload = buildRecordPayload({
      results,
      sessionContext: {
        sessionType: 1,
        lessonSlug: null,
        lessonUnitOrder: null,
        wordBankSlug: null,
      },
      config: { duration: 30, wordCount: 10, maxErrors: 2, isZenMode: false },
      targetWordCount: 25,
      wpmTimeline,
    });

    expect(payload.wordCount).toBe(10);
    expect(payload.sessionType).toBe(1);
    expect(payload.durationLimitSeconds).toBe(30);
  });
});