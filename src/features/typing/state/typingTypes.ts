export type TestStatus = "idle" | "ready" | "active" | "paused" | "completed";

export type CharState = "pending" | "correct" | "fixed" | "incorrect" | "current";

export interface TypingResults {
  wpm: number;
  grossWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  elapsedTime: number;
}

export interface TypingState {
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
}
