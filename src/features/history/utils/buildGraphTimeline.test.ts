import type { TypingTestResult } from "../state/historyTypes";
import { buildGraphTimeline } from "./buildGraphTimeline";

function makeResult(
  overrides: Partial<TypingTestResult> = {},
): TypingTestResult {
  return {
    publicId: "result-1",
    sessionType: 0,
    wpm: 65,
    rawWpm: 70,
    accuracy: 93,
    correctCharacterCount: 300,
    incorrectCharacterCount: 4,
    totalCharacterCount: 304,
    durationSeconds: 60,
    wordCount: 60,
    totalWordsTyped: 60,
    wordsTypedWithErrors: 2,
    wordsTypedWithCorrections: 3,
    wordsTypedPerfectly: 55,
    highestWpm: 82,
    lowestWpm: 44,
    averageWpm: 62,
    durationLimitSeconds: null,
    maxWords: null,
    maxErrors: null,
    isZenMode: false,
    wordBankSlug: null,
    lessonSlug: null,
    lessonUnitOrder: null,
    completedAtUtc: "2026-01-15T10:30:00.000Z",
    typedWords: [],
    wpmTimeline: [],
    ...overrides,
  };
}

describe("buildGraphTimeline", () => {
  it("preserves the persisted timeline seconds and WPM", () => {
    const result = makeResult({
      wpmTimeline: [
        { second: 1, wpm: 60 },
        { second: 2, wpm: 70 },
        { second: 3, wpm: 80 },
      ],
    });

    expect(buildGraphTimeline(result)).toEqual([
      { second: 1, wpm: 60, words: [] },
      { second: 2, wpm: 70, words: [] },
      { second: 3, wpm: 80, words: [] },
    ]);
  });

  it("attaches the words typed in each second to the matching point", () => {
    const result = makeResult({
      typedWords: [
        {
          wordText: "alpha",
          second: 1,
          wpm: 60,
          charStates: ["correct", "correct", "correct", "correct", "correct"],
        },
        {
          wordText: "beta",
          second: 1,
          wpm: 60,
          charStates: ["correct", "correct", "correct", "correct"],
        },
        {
          wordText: "gamma",
          second: 2,
          wpm: 70,
          charStates: ["correct", "correct", "correct", "correct", "correct"],
        },
      ],
      wpmTimeline: [
        { second: 1, wpm: 60 },
        { second: 2, wpm: 70 },
        { second: 3, wpm: 80 },
      ],
    });

    expect(buildGraphTimeline(result)).toEqual([
      { second: 1, wpm: 60, words: ["alpha", "beta"] },
      { second: 2, wpm: 70, words: ["gamma"] },
      { second: 3, wpm: 80, words: [] },
    ]);
  });

  it("returns an empty timeline for results without timeline data", () => {
    expect(buildGraphTimeline(makeResult())).toEqual([]);
  });
});