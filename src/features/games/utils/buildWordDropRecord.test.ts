import { describe, it, expect } from "vitest";
import type { WordDropResults } from "../state/gamesTypes";
import { SessionTypeValue } from "@/features/history/state/historyTypes";
import { buildWordDropRecord } from "./buildWordDropRecord";

const results: WordDropResults = {
  accuracy: 90,
  correctCharacters: 90,
  incorrectCharacters: 10,
  totalCharactersTyped: 100,
  wordsCompleted: 3,
  wordsPerfect: 1,
  wordsCorrected: 1,
  wordsErrored: 1,
  score: 1250,
  elapsedTime: 12,
  maxWordsReached: false,
  averageWpm: 65,
  highestWpm: 90,
  lowestWpm: 40,
  timeLimit: null,
  wordLimit: null,
  maxErrors: null,
  isZenMode: true,
  wordBankSlug: null,
  stacked: [
    {
      id: 1,
      word: "the",
      quality: "perfect",
      completedAt: 2,
      wpm: 70,
    },
    {
      id: 2,
      word: "cat",
      quality: "corrected",
      completedAt: 5,
      wpm: 60,
    },
    {
      id: 3,
      word: "dog",
      quality: "errored",
      completedAt: 9,
      wpm: 20,
    },
  ],
};

describe("buildWordDropRecord", () => {
  it("builds a history payload for the Word Drop session type", () => {
    const payload = buildWordDropRecord(results);
    expect(payload.sessionType).toBe(SessionTypeValue.WordDrop);
    expect(payload.score).toBe(1250);
    expect(payload.accuracy).toBe(90);
    expect(payload.durationSeconds).toBe(12);
    expect(payload.wordsTypedPerfectly).toBe(1);
    expect(payload.wordsTypedWithCorrections).toBe(1);
    expect(payload.wordsTypedWithErrors).toBe(1);
    expect(payload.isZenMode).toBe(true);
    expect(payload.wpm).toBe(65);
  });

  it("maps stacked words to typed words with per-character states", () => {
    const payload = buildWordDropRecord(results);
    expect(payload.typedWords).toHaveLength(3);
    expect(payload.typedWords[0]).toEqual({
      wordText: "the",
      second: 2,
      wpm: 70,
      charStates: ["correct", "correct", "correct"],
    });
    expect(payload.typedWords[1]!.charStates).toEqual(["fixed", "fixed", "fixed"]);
    expect(payload.typedWords[2]!.charStates).toEqual([
      "incorrect",
      "incorrect",
      "incorrect",
    ]);
  });

  it("produces a single-point wpm timeline at the elapsed second", () => {
    const payload = buildWordDropRecord(results);
    expect(payload.wpmTimeline).toEqual([{ second: 12, wpm: 65 }]);
  });
});
