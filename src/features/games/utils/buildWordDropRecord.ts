import { SessionTypeValue } from "@/features/history/state/historyTypes";
import type {
  RecordTypingResultPayload,
  SavedCharState,
  TypedWord,
  WpmPoint,
} from "@/features/history/state/historyTypes";
import type { WordDropResults } from "../state/gamesTypes";

function charStatesFor(quality: string, word: string): SavedCharState[] {
  if (quality === "errored") {
    return word.split("").map(() => "incorrect" as SavedCharState);
  }
  if (quality === "corrected") {
    return word.split("").map(() => "fixed" as SavedCharState);
  }
  return word.split("").map(() => "correct" as SavedCharState);
}

/**
 * Builds the persistence payload for a finished Word Drop game so the result
 * can be recorded through the shared history slice and surfaced in history
 * alongside typing tests. Typing-style fields are populated from the game's
 * metrics and the score is carried in the optional `score` field.
 */
export function buildWordDropRecord(
  results: WordDropResults,
): RecordTypingResultPayload {
  const typedWords: TypedWord[] = results.stacked.map((word) => ({
    wordText: word.word,
    second: Math.max(1, Math.round(word.completedAt)),
    wpm: Math.round(word.wpm),
    charStates: charStatesFor(word.quality, word.word),
  }));

  const wpmTimeline: WpmPoint[] = [
    {
      second: Math.max(1, Math.round(results.elapsedTime)),
      wpm: Math.round(results.averageWpm),
    },
  ];

  return {
    sessionType: SessionTypeValue.WordDrop,
    wpm: Math.round(results.averageWpm),
    rawWpm: Math.round(results.averageWpm),
    accuracy: results.accuracy,
    correctCharacterCount: results.correctCharacters,
    incorrectCharacterCount: results.incorrectCharacters,
    durationSeconds: results.elapsedTime,
    wordCount: results.wordsCompleted,
    totalWordsTyped: results.wordsCompleted,
    wordsTypedWithErrors: results.wordsErrored,
    wordsTypedWithCorrections: results.wordsCorrected,
    wordsTypedPerfectly: results.wordsPerfect,
    highestWpm: Math.round(results.highestWpm),
    lowestWpm: Math.round(results.lowestWpm),
    averageWpm: Math.round(results.averageWpm),
    durationLimitSeconds: results.timeLimit,
    maxWords: results.wordLimit,
    maxErrors: results.maxErrors,
    isZenMode: results.isZenMode,
    wordBankSlug: results.wordBankSlug,
    lessonSlug: null,
    lessonUnitOrder: null,
    typedWords,
    wpmTimeline,
    score: results.score,
  };
}
