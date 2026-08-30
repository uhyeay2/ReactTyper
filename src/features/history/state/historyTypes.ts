export const SessionTypeValue = {
  TypingTest: 0,
  Lesson: 1,
  LessonUnit: 2,
} as const;

export type SessionType = (typeof SessionTypeValue)[keyof typeof SessionTypeValue];

export type SavedCharState = "correct" | "fixed" | "incorrect";

export interface TypedWord {
  wordText: string;
  second: number;
  wpm: number;
  charStates: SavedCharState[];
}

export interface WpmPoint {
  second: number;
  wpm: number;
}

export interface TypingTestResult {
  publicId: string;
  sessionType: SessionType;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctCharacterCount: number;
  incorrectCharacterCount: number;
  totalCharacterCount: number;
  durationSeconds: number;
  wordCount: number;
  totalWordsTyped: number;
  wordsTypedWithErrors: number;
  wordsTypedWithCorrections: number;
  wordsTypedPerfectly: number;
  highestWpm: number;
  lowestWpm: number;
  averageWpm: number;
  durationLimitSeconds: number | null;
  maxWords: number | null;
  maxErrors: number | null;
  isZenMode: boolean;
  wordBankSlug: string | null;
  lessonSlug: string | null;
  lessonUnitOrder: number | null;
  completedAtUtc: string;
  typedWords: TypedWord[];
  wpmTimeline: WpmPoint[];
}

export interface RecordTypingResultPayload {
  sessionType: SessionType;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctCharacterCount: number;
  incorrectCharacterCount: number;
  durationSeconds: number;
  wordCount: number;
  totalWordsTyped: number;
  wordsTypedWithErrors: number;
  wordsTypedWithCorrections: number;
  wordsTypedPerfectly: number;
  highestWpm: number;
  lowestWpm: number;
  averageWpm: number;
  durationLimitSeconds: number | null;
  maxWords: number | null;
  maxErrors: number | null;
  isZenMode: boolean;
  wordBankSlug: string | null;
  lessonSlug: string | null;
  lessonUnitOrder: number | null;
  typedWords: TypedWord[];
  wpmTimeline: WpmPoint[];
}
