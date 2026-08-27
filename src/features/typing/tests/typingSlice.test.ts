import { describe, it, expect } from "vitest";
import typingReducer, {
  startTest,
  updateTypedText,
  completeTest,
  resetToReady,
  refreshTest,
  readyTest,
  startReadyTest,
  selectTypingStatus,
  selectTargetText,
  selectResults,
} from "../state/typingSlice";
import type { TypingState } from "../state/typingTypes";

const initialState: TypingState = {
  status: "idle",
  targetText: "",
  typedText: "",
  currentIndex: 0,
  errors: 0,
  correctChars: 0,
  totalTyped: 0,
  startTime: null,
  elapsedTime: 0,
  results: null,
  wordCount: 50,
  fixedChars: "",
  pausedElapsed: 0,
};

describe("typingSlice", () => {
  describe("startTest", () => {
    it("sets status to active and generates target text", () => {
      const state = typingReducer(initialState, startTest());
      expect(state.status).toBe("active");
      expect(state.targetText.length).toBeGreaterThan(0);
      expect(state.startTime).toBeTypeOf("number");
    });

    it("respects custom word count", () => {
      const state = typingReducer(initialState, startTest(10));
      const words = state.targetText.split(" ");
      expect(words.length).toBe(10);
    });
  });

  describe("readyTest", () => {
    it("transitions from idle to ready", () => {
      const state = typingReducer(initialState, readyTest());
      expect(state.status).toBe("ready");
    });

    it("does nothing if not idle", () => {
      const state = typingReducer(
        { ...initialState, status: "active" },
        readyTest(),
      );
      expect(state.status).toBe("active");
    });
  });

  describe("startReadyTest", () => {
    it("transitions from ready to active", () => {
      const state = typingReducer(
        { ...initialState, status: "ready" },
        startReadyTest(),
      );
      expect(state.status).toBe("active");
      expect(state.startTime).toBeTypeOf("number");
    });

    it("does nothing if not ready", () => {
      const state = typingReducer(initialState, startReadyTest());
      expect(state.status).toBe("idle");
    });
  });

  describe("updateTypedText", () => {
    it("updates typed text and metrics", () => {
      const state = typingReducer(
        { ...initialState, status: "active", targetText: "hello" },
        updateTypedText({
          typedText: "h",
          currentIndex: 1,
          correctChars: 1,
          errors: 0,
          totalTyped: 1,
          fixedChars: "0",
        }),
      );
      expect(state.typedText).toBe("h");
      expect(state.currentIndex).toBe(1);
      expect(state.correctChars).toBe(1);
    });
  });

  describe("completeTest", () => {
    it("sets status to completed and stores results", () => {
      const results = {
        wpm: 60,
        grossWpm: 65,
        accuracy: 95,
        correctChars: 200,
        incorrectChars: 10,
        elapsedTime: 60,
      };
      const state = typingReducer(
        { ...initialState, status: "active" },
        completeTest({ results }),
      );
      expect(state.status).toBe("completed");
      expect(state.results).toEqual(results);
    });
  });

  describe("resetToReady", () => {
    it("resets to ready with same target text", () => {
      const state = typingReducer(
        {
          ...initialState,
          status: "active",
          targetText: "the quick brown fox",
          typedText: "the qu",
          currentIndex: 6,
        },
        resetToReady(),
      );
      expect(state.status).toBe("ready");
      expect(state.typedText).toBe("");
      expect(state.currentIndex).toBe(0);
      expect(state.targetText).toBe("the quick brown fox");
    });
  });

  describe("refreshTest", () => {
    it("resets to ready with new target text", () => {
      const oldText = "the cat sat on the mat";
      const state = typingReducer(
        {
          ...initialState,
          status: "active",
          targetText: oldText,
          typedText: "the ca",
          currentIndex: 6,
        },
        refreshTest(),
      );
      expect(state.status).toBe("ready");
      expect(state.typedText).toBe("");
      expect(state.currentIndex).toBe(0);
      expect(state.targetText).not.toBe(oldText);
    });
  });

  describe("selectors", () => {
    it("selectTypingStatus returns status", () => {
      const state = { typing: { ...initialState, status: "active" as const } };
      expect(selectTypingStatus(state)).toBe("active");
    });

    it("selectTargetText returns target text", () => {
      const state = {
        typing: { ...initialState, targetText: "hello world" },
      };
      expect(selectTargetText(state)).toBe("hello world");
    });

    it("selectResults returns results", () => {
      const results = {
        wpm: 60,
        grossWpm: 65,
        accuracy: 95,
        correctChars: 200,
        incorrectChars: 10,
        elapsedTime: 60,
      };
      const state = { typing: { ...initialState, results } };
      expect(selectResults(state)).toEqual(results);
    });
  });
});
