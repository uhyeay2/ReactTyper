export type WordDropStatus = "idle" | "ready" | "active" | "completed";

/** Accuracy classification of a single recorded word. */
export type WordDropWordQuality =
  | "perfect"
  | "corrected"
  | "errored";

/** A word that has been completed and removed from the on-screen stack. */
export interface WordDropStackedWord {
  id: number;
  word: string;
  quality: WordDropWordQuality;
  /** Seconds elapsed in the game when the word was completed. */
  completedAt: number;
  /** Typing WPM at the moment the word was completed. */
  wpm: number;
}

/**
 * A word currently present in the on-screen stack. The stack is ordered from
 * the bottom (index 0, which is the active typing target) upward.
 */
export interface WordDropQueuedWord {
  id: number;
  text: string;
}

export interface WordDropMetrics {
  accuracy: number;
  correctCharacters: number;
  incorrectCharacters: number;
  totalCharactersTyped: number;
  wordsCompleted: number;
  wordsPerfect: number;
  wordsCorrected: number;
  wordsErrored: number;
  score: number;
  elapsedTime: number;
  maxWordsReached: boolean;
  /** Average typing WPM across completed words. */
  averageWpm: number;
  highestWpm: number;
  lowestWpm: number;
}

export interface WordDropResults extends WordDropMetrics {
  elapsedTime: number;
  timeLimit: number | null;
  wordLimit: number | null;
  maxErrors: number | null;
  isZenMode: boolean;
  wordBankSlug: string | null;
  /** Every word processed during the game (completed and errored). */
  stacked: WordDropStackedWord[];
}

export interface WordDropSessionContext {
  timeLimit: number | null;
  wordLimit: number | null;
  maxErrors: number | null;
  isZenMode: boolean;
  wordBankSlug: string | null;
}

export interface WordDropState {
  status: WordDropStatus;
  /**
   * The on-screen stack of words yet to be fully typed. Index 0 is the bottom
   * word, which is the active typing target.
   */
  words: WordDropQueuedWord[];
  /**
   * The word that will spawn next, shown as a preview above the field. Empty
   * when no further word will spawn (e.g. the word budget is exhausted).
   */
  nextWord: string;
  /** Typed prefix for the active (bottom) word. */
  typed: string;
  /** Words already completed and recorded for scoring/history. */
  completed: WordDropStackedWord[];
  metrics: WordDropMetrics;
  /** Absolute gameplay elapsed time in seconds. */
  elapsedTime: number;
  /** Whether the last keystroke for the active word was incorrect. */
  bufferError: boolean;
  results: WordDropResults | null;
  sessionContext: WordDropSessionContext;
}
