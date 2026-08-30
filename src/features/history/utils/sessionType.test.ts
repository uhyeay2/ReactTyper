import { describe, it, expect } from "vitest";
import {
  SessionTypeValue,
  type SessionType,
} from "../state/historyTypes";
import {
  isLessonSessionType,
  sessionTypeLabel,
} from "./sessionType";

describe("sessionType", () => {
  describe("sessionTypeLabel", () => {
    it("labels a typing test session", () => {
      expect(sessionTypeLabel(SessionTypeValue.TypingTest)).toBe("Typing Test");
    });

    it("labels a lesson session", () => {
      expect(sessionTypeLabel(SessionTypeValue.Lesson)).toBe("Lesson");
    });

    it("labels a lesson unit session", () => {
      expect(sessionTypeLabel(SessionTypeValue.LessonUnit)).toBe("Lesson Unit");
    });

    it("falls back to Typing Test for unknown values", () => {
      expect(sessionTypeLabel(99 as unknown as SessionType)).toBe(
        "Typing Test",
      );
    });
  });

  describe("isLessonSessionType", () => {
    it("returns true for Lesson", () => {
      expect(isLessonSessionType(SessionTypeValue.Lesson)).toBe(true);
    });

    it("returns true for LessonUnit", () => {
      expect(isLessonSessionType(SessionTypeValue.LessonUnit)).toBe(true);
    });

    it("returns false for TypingTest", () => {
      expect(isLessonSessionType(SessionTypeValue.TypingTest)).toBe(false);
    });
  });
});