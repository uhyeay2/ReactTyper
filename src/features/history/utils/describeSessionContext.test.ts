import { describe, it, expect } from "vitest";
import {
  SessionTypeValue,
  type TypingTestResult,
} from "../state/historyTypes";
import { describeSessionContext } from "./describeSessionContext";

function makeResult(
  overrides: Partial<TypingTestResult> = {},
): TypingTestResult {
  return {
    publicId: "result-1",
    sessionType: SessionTypeValue.TypingTest,
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
    lessonTitle: null,
    lessonUnitOrder: null,
    lessonUnitTitle: null,
    completedAtUtc: "2026-01-15T10:30:00.000Z",
    typedWords: [],
    wpmTimeline: [],
    ...overrides,
  };
}

describe("describeSessionContext", () => {
  describe("typing test", () => {
    it("describes time limit, word limit, and max errors", () => {
      const result = makeResult({
        durationLimitSeconds: 60,
        maxWords: 50,
        maxErrors: 3,
      });

      expect(describeSessionContext(result)).toEqual({
        summary: "1m Time Limit \u00b7 50 Word Limit \u00b7 3 Max Errors",
      });
    });

    it("describes Zen Mode", () => {
      const result = makeResult({ isZenMode: true });

      expect(describeSessionContext(result)).toEqual({ summary: "Zen Mode" });
    });

    it("falls back to No limits when no settings were used", () => {
      expect(describeSessionContext(makeResult())).toEqual({
        summary: "No limits",
      });
    });
  });

  describe("lesson and lesson unit", () => {
    it("describes the true lesson title and unit title for a lesson unit", () => {
      const result = makeResult({
        sessionType: SessionTypeValue.LessonUnit,
        lessonSlug: "lesson-1",
        lessonTitle: "Home Row",
        lessonUnitOrder: 2,
        lessonUnitTitle: "Sequence Practice",
      });

      expect(describeSessionContext(result)).toEqual({
        summary: "Lesson Home Row \u00b7 Unit 3: Sequence Practice",
      });
    });

    it("describes the true lesson title for a lesson session", () => {
      const result = makeResult({
        sessionType: SessionTypeValue.Lesson,
        lessonSlug: "lesson-a",
        lessonTitle: "Accuracy Essentials",
        lessonUnitOrder: null,
        lessonUnitTitle: null,
      });

      expect(describeSessionContext(result)).toEqual({
        summary: "Lesson Accuracy Essentials",
      });
    });

    it("falls back to the lesson slug when the title is absent", () => {
      const result = makeResult({
        sessionType: SessionTypeValue.LessonUnit,
        lessonSlug: "lesson-1",
        lessonTitle: null,
        lessonUnitOrder: 2,
        lessonUnitTitle: null,
      });

      expect(describeSessionContext(result)).toEqual({
        summary: "Lesson lesson-1 \u00b7 Unit 3",
      });
    });

    it("falls back to the session label when no lesson data is present", () => {
      expect(
        describeSessionContext(
          makeResult({
            sessionType: SessionTypeValue.LessonUnit,
            lessonSlug: null,
            lessonTitle: null,
            lessonUnitOrder: null,
            lessonUnitTitle: null,
          }),
        ),
      ).toEqual({ summary: "Lesson Unit" });
    });
  });
});
