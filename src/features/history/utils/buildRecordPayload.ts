import type {
  CharState,
  TypingResults,
  TypingSessionContext,
} from "@/features/typing/state/typingTypes";
import { type WpmTimelinePoint } from "@/features/typing/metrics/wpm";
import type {
  RecordTypingResultPayload,
  SavedCharState,
  SessionType,
  TypedWord,
  WpmPoint,
} from "../state/historyTypes";

export interface RecordPayloadConfig {
  duration: number | null;
  wordCount: number | null;
  maxErrors: number | null;
  isZenMode: boolean;
}

export interface BuildRecordPayloadInput {
  results: TypingResults;
  sessionContext: TypingSessionContext;
  config: RecordPayloadConfig;
  targetWordCount: number;
  wpmTimeline: WpmTimelinePoint[];
}

const SAVED_CHAR_STATES: Record<CharState, SavedCharState> = {
  correct: "correct",
  fixed: "fixed",
  incorrect: "incorrect",
  pending: "correct",
  current: "correct",
};

/**
 * Maps a completed word to its persisted shape, carrying the per-character
 * correct/fixed/incorrect coloring so history renders identically to the
 * post-test review (dropping character indexes, which are only meaningful
 * during the live session).
 */
function toTypedWord(
  word: TypingResults["wordStates"][number],
  charStates: CharState[],
): TypedWord {
  return {
    wordText: word.wordText,
    second: word.second,
    wpm: word.wpm,
    charStates: charStates
      .slice(word.startCharIndex, word.endCharIndex + 1)
      .map((state) => SAVED_CHAR_STATES[state]),
  };
}

/** Maps a live timeline point (second, wpm, words) to its persisted shape. */
function toWpmPoint(point: WpmTimelinePoint): WpmPoint {
  return {
    second: point.second,
    wpm: point.wpm,
  };
}

export function buildRecordPayload({
  results,
  sessionContext,
  config,
  targetWordCount,
  wpmTimeline,
}: BuildRecordPayloadInput): RecordTypingResultPayload {
  return {
    sessionType: sessionContext.sessionType as SessionType,
    wpm: Math.round(results.wpm),
    rawWpm: Math.round(results.grossWpm),
    accuracy: results.accuracy,
    correctCharacterCount: results.correctChars,
    incorrectCharacterCount: results.incorrectChars,
    durationSeconds: results.elapsedTime,
    wordCount: config.wordCount ?? targetWordCount,
    totalWordsTyped: results.totalWordsTyped,
    wordsTypedWithErrors: results.wordsTypedWithErrors,
    wordsTypedWithCorrections: results.wordsTypedWithCorrections,
    wordsTypedPerfectly: results.wordsTypedPerfectly,
    highestWpm: Math.round(results.highestWpm),
    lowestWpm: Math.round(results.lowestWpm),
    averageWpm: Math.round(results.averageWpm),
    durationLimitSeconds: config.duration,
    maxWords: config.wordCount,
    maxErrors: config.maxErrors,
    isZenMode: config.isZenMode,
    wordBankSlug: sessionContext.wordBankSlug,
    lessonSlug: sessionContext.lessonSlug,
    lessonUnitOrder: sessionContext.lessonUnitOrder,
    typedWords: results.wordStates.map((word) =>
      toTypedWord(word, results.charStates),
    ),
    wpmTimeline: wpmTimeline.map(toWpmPoint),
  };
}
