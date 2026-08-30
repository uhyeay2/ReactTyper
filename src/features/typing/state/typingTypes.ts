import type { Keystroke, WordState, WpmTimelinePoint } from "../metrics/wpm";

export type TestStatus = "idle" | "ready" | "active" | "paused" | "completed";

export type ViewType = "home" | "test";

export interface TypingSessionContext {
  sessionType: number;
  lessonSlug: string | null;
  lessonUnitOrder: number | null;
  wordBankSlug: string | null;
}

export type CharState =
  "pending" | "correct" | "fixed" | "incorrect" | "current";

export interface TypingResults {
  wpm: number;
  grossWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  elapsedTime: number;
  totalWordsTyped: number;
  wordsTypedWithErrors: number;
  wordsTypedWithCorrections: number;
  wordsTypedPerfectly: number;
  highestWpm: number;
  lowestWpm: number;
  averageWpm: number;
  wordStates: WordState[];
  charStates: CharState[];
}

export interface WpmSnapshot {
  second: number;
  totalTyped: number;
  errors: number;
}

export interface TypingState {
  view: ViewType;
  status: TestStatus;
  targetText: string;
  typedText: string;
  currentIndex: number;
  errors: number;
  correctChars: number;
  totalTyped: number;
  startTime: number | null;
  elapsedTime: number;
  results: TypingResults | null;
  wordCount: number;
  fixedChars: string;
  pausedElapsed: number;
  wpmHistory: WpmSnapshot[];
  keystrokes: Keystroke[];
  liveWpm: number;
  wpmTimeline: WpmTimelinePoint[];
  sessionContext: TypingSessionContext;
}
