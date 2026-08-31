import { describe, it, expect } from "vitest";
import typingReducer, {
  startTest,
  updateTypedText,
  refreshLiveWpm,
  completeTest,
  resetToReady,
  refreshTest,
  readyTest,
  startReadyTest,
  navigateHome,
  startFromHome,
  recordWpmSnapshot,
  recordLiveWpm,
  selectTypingStatus,
  selectTargetText,
  selectResults,
  selectView,
  selectWpmHistory,
  selectLiveWpm,
  selectLiveWpmReady,
  selectWpmTimeline,
  selectKeystrokes,
  selectSessionContext,
  selectIsLessonSession,
  pauseTest,
  resumeTest,
  selectFinalErrors,
} from "../state/typingSlice";
import type { TypingState } from "../state/typingTypes";
import { SessionTypeValue } from "@/features/history/state/historyTypes";

const initialState: TypingState = {
  view: "home",
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
  wpmHistory: [],
  keystrokes: [],
  liveWpm: 0,
  wpmTimeline: [],
  sessionContext: {
    sessionType: 0,
    lessonSlug: null,
    lessonUnitOrder: null,
    wordBankSlug: null,
  },
};

describe("typingSlice", () => {
  describe("startTest", () => {
    it("sets status to active and generates target text", () => {
      const state = typingReducer(initialState, startTest({}));
      expect(state.status).toBe("active");
      expect(state.targetText.length).toBeGreaterThan(0);
      expect(state.startTime).toBeTypeOf("number");
    });

    it("respects custom word count", () => {
      const state = typingReducer(initialState, startTest({ wordCount: 10 }));
      const words = state.targetText.split(" ");
      expect(words.length).toBe(10);
    });

    it("records the selected word bank slug", () => {
      const state = typingReducer(
        initialState,
        startTest({ wordCount: 10, wordBankSlug: "english-top-200" }),
      );
      expect(state.sessionContext.wordBankSlug).toBe("english-top-200");
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
      expect(state.status).toBe("ready");
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
          keystroke: { timestamp: 123, charIndex: 0 },
        }),
      );
      expect(state.typedText).toBe("h");
      expect(state.currentIndex).toBe(1);
      expect(state.correctChars).toBe(1);
      expect(state.keystrokes).toEqual([{ timestamp: 123, charIndex: 0 }]);
    });
  });

  describe("completeTest", () => {
    it("sets status to completed and stores results and timeline", () => {
      const results = {
        wpm: 60,
        grossWpm: 65,
        accuracy: 95,
        correctChars: 200,
        incorrectChars: 10,
        elapsedTime: 60,
        totalWordsTyped: 50,
        wordsTypedWithErrors: 4,
        wordsTypedWithCorrections: 6,
        wordsTypedPerfectly: 40,
        highestWpm: 85,
        lowestWpm: 40,
        averageWpm: 62,
        wordStates: [],
        charStates: [],
      };
      const state = typingReducer(
        { ...initialState, status: "active" },
        completeTest({
          results,
          wpmTimeline: [{ second: 1, wpm: 60, words: ["hello"] }],
        }),
      );
      expect(state.status).toBe("completed");
      expect(state.results).toEqual(results);
      expect(state.wpmTimeline).toEqual([
        { second: 1, wpm: 60, words: ["hello"] },
      ]);
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

    it("preserves the session context", () => {
      const state = typingReducer(
        {
          ...initialState,
          status: "active",
          sessionContext: {
            sessionType: SessionTypeValue.LessonUnit,
            lessonSlug: "lesson-a",
            lessonUnitOrder: 1,
            wordBankSlug: null,
          },
        },
        resetToReady(),
      );
      expect(state.sessionContext).toEqual({
        sessionType: SessionTypeValue.LessonUnit,
        lessonSlug: "lesson-a",
        lessonUnitOrder: 1,
        wordBankSlug: null,
      });
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
        refreshTest({ wordCount: 50, wordBankSlug: null }),
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
        totalWordsTyped: 50,
        wordsTypedWithErrors: 4,
        wordsTypedWithCorrections: 6,
        wordsTypedPerfectly: 40,
        highestWpm: 85,
        lowestWpm: 40,
        averageWpm: 62,
        wordStates: [],
        charStates: [],
      };
      const state = { typing: { ...initialState, results } };
      expect(selectResults(state)).toEqual(results);
    });

    it("selectView returns view", () => {
      const state = { typing: { ...initialState, view: "test" as const } };
      expect(selectView(state)).toBe("test");
    });

    it("selectSessionContext returns the session context", () => {
      const sessionContext = {
        sessionType: SessionTypeValue.LessonUnit,
        lessonSlug: "lesson-a",
        lessonUnitOrder: 0,
        wordBankSlug: null,
      };
      const state = { typing: { ...initialState, sessionContext } };
      expect(selectSessionContext(state)).toEqual(sessionContext);
    });

    it("selectIsLessonSession is false for a typing test session", () => {
      const state = {
        typing: {
          ...initialState,
          sessionContext: { ...initialState.sessionContext, sessionType: 0 },
        },
      };
      expect(selectIsLessonSession(state)).toBe(false);
    });

    it("selectIsLessonSession is true for a lesson unit session", () => {
      const state = {
        typing: {
          ...initialState,
          sessionContext: {
            sessionType: SessionTypeValue.LessonUnit,
            lessonSlug: "lesson-a",
            lessonUnitOrder: 0,
            wordBankSlug: null,
          },
        },
      };
      expect(selectIsLessonSession(state)).toBe(true);
    });

    it("selectIsLessonSession is true for a lesson session", () => {
      const state = {
        typing: {
          ...initialState,
          sessionContext: {
            sessionType: SessionTypeValue.Lesson,
            lessonSlug: "lesson-a",
            lessonUnitOrder: null,
            wordBankSlug: null,
          },
        },
      };
      expect(selectIsLessonSession(state)).toBe(true);
    });
  });

  describe("navigateHome", () => {
    it("resets to home view with idle status", () => {
      const state = typingReducer(
        {
          ...initialState,
          view: "test",
          status: "active",
          typedText: "hello",
          currentIndex: 5,
        },
        navigateHome(),
      );
      expect(state.view).toBe("home");
      expect(state.status).toBe("idle");
      expect(state.typedText).toBe("");
      expect(state.currentIndex).toBe(0);
    });
  });

  describe("startFromHome", () => {
    it("sets view to test and generates target text", () => {
      const state = typingReducer(
        initialState,
        startFromHome({ wordCount: 10 }),
      );
      expect(state.view).toBe("test");
      expect(state.status).toBe("ready");
      const words = state.targetText.split(" ");
      expect(words.length).toBe(10);
      expect(state.wordCount).toBe(10);
    });

    it("resets all test state", () => {
      const state = typingReducer(
        {
          ...initialState,
          view: "test",
          status: "completed",
          typedText: "something",
          currentIndex: 9,
          results: {
            wpm: 50,
            grossWpm: 55,
            accuracy: 90,
            correctChars: 100,
            incorrectChars: 5,
            elapsedTime: 60,
            totalWordsTyped: 25,
            wordsTypedWithErrors: 2,
            wordsTypedWithCorrections: 3,
            wordsTypedPerfectly: 20,
            highestWpm: 70,
            lowestWpm: 30,
            averageWpm: 50,
            wordStates: [],
            charStates: [],
          },
        },
        startFromHome({ wordCount: 25 }),
      );
      expect(state.view).toBe("test");
      expect(state.status).toBe("ready");
      expect(state.typedText).toBe("");
      expect(state.currentIndex).toBe(0);
      expect(state.results).toBeNull();
    });
  });

  describe("keystroke log", () => {
    it("appends a keystroke on each typed character", () => {
      let state = typingReducer(
        initialState,
        updateTypedText({
          typedText: "h",
          currentIndex: 1,
          correctChars: 1,
          errors: 0,
          totalTyped: 1,
          fixedChars: "0",
          keystroke: { timestamp: 1, charIndex: 0 },
        }),
      );
      state = typingReducer(
        state,
        updateTypedText({
          typedText: "he",
          currentIndex: 2,
          correctChars: 2,
          errors: 0,
          totalTyped: 2,
          fixedChars: "00",
          keystroke: { timestamp: 2, charIndex: 1 },
        }),
      );
      expect(state.keystrokes).toEqual([
        { timestamp: 1, charIndex: 0 },
        { timestamp: 2, charIndex: 1 },
      ]);
    });

    it("pops the last keystroke when typing is undone (backspace)", () => {
      let state = typingReducer(
        initialState,
        updateTypedText({
          typedText: "h",
          currentIndex: 1,
          correctChars: 1,
          errors: 0,
          totalTyped: 1,
          fixedChars: "0",
          keystroke: { timestamp: 1, charIndex: 0 },
        }),
      );
      state = typingReducer(
        state,
        updateTypedText({
          typedText: "he",
          currentIndex: 2,
          correctChars: 2,
          errors: 0,
          totalTyped: 2,
          fixedChars: "00",
          keystroke: { timestamp: 2, charIndex: 1 },
        }),
      );
      state = typingReducer(
        state,
        updateTypedText({
          typedText: "h",
          currentIndex: 1,
          correctChars: 1,
          errors: 0,
          totalTyped: 1,
          fixedChars: "0",
          keystroke: null,
        }),
      );
      expect(state.keystrokes).toEqual([{ timestamp: 1, charIndex: 0 }]);
    });
  });

  describe("live WPM", () => {
    it("stays at zero before the live window is satisfied", () => {
      const state = typingReducer(
        initialState,
        updateTypedText({
          typedText: "h",
          currentIndex: 1,
          correctChars: 1,
          errors: 0,
          totalTyped: 1,
          fixedChars: "0",
          keystroke: { timestamp: 0, charIndex: 0 },
        }),
      );
      expect(state.liveWpm).toBe(0);
    });

    it("refreshLiveWpm recomputes from the existing keystroke log", () => {
      const keystrokes = Array.from({ length: 12 }, (_, i) => ({
        timestamp: i * 200,
        charIndex: i,
      }));
      const state = typingReducer(
        { ...initialState, keystrokes },
        refreshLiveWpm(),
      );
      expect(state.liveWpm).toBeGreaterThan(0);
    });

    it("keeps the previous value while the window is below the time threshold", () => {
      const keystrokes = Array.from({ length: 12 }, (_, i) => ({
        timestamp: i * 50,
        charIndex: i,
      }));
      const state = typingReducer(
        { ...initialState, liveWpm: 41, keystrokes },
        refreshLiveWpm(),
      );
      expect(state.liveWpm).toBe(41);
    });
  });

  describe("recordWpmSnapshot", () => {
    it("appends a new snapshot", () => {
      const state = typingReducer(
        initialState,
        recordWpmSnapshot({ second: 1, totalTyped: 5, errors: 0 }),
      );
      expect(state.wpmHistory).toEqual([
        { second: 1, totalTyped: 5, errors: 0 },
      ]);
    });

    it("updates the snapshot for the same second", () => {
      let state = typingReducer(
        initialState,
        recordWpmSnapshot({ second: 1, totalTyped: 5, errors: 0 }),
      );
      state = typingReducer(
        state,
        recordWpmSnapshot({ second: 1, totalTyped: 8, errors: 0 }),
      );
      expect(state.wpmHistory).toEqual([
        { second: 1, totalTyped: 8, errors: 0 },
      ]);
    });

    it("appends distinct seconds in order", () => {
      let state = typingReducer(
        initialState,
        recordWpmSnapshot({ second: 1, totalTyped: 5, errors: 0 }),
      );
      state = typingReducer(
        state,
        recordWpmSnapshot({ second: 2, totalTyped: 11, errors: 0 }),
      );
      state = typingReducer(
        state,
        recordWpmSnapshot({ second: 3, totalTyped: 18, errors: 0 }),
      );
      expect(state.wpmHistory).toEqual([
        { second: 1, totalTyped: 5, errors: 0 },
        { second: 2, totalTyped: 11, errors: 0 },
        { second: 3, totalTyped: 18, errors: 0 },
      ]);
    });
  });

  describe("recordLiveWpm", () => {
    it("appends a new timeline point", () => {
      const state = typingReducer(
        initialState,
        recordLiveWpm({ second: 1, wpm: 45 }),
      );
      expect(state.wpmTimeline).toEqual([{ second: 1, wpm: 45, words: [] }]);
    });

    it("updates the WPM for the same second", () => {
      let state = typingReducer(
        initialState,
        recordLiveWpm({ second: 1, wpm: 45 }),
      );
      state = typingReducer(state, recordLiveWpm({ second: 1, wpm: 52 }));
      expect(state.wpmTimeline).toEqual([{ second: 1, wpm: 52, words: [] }]);
    });

    it("appends distinct seconds in order", () => {
      let state = typingReducer(
        initialState,
        recordLiveWpm({ second: 1, wpm: 45 }),
      );
      state = typingReducer(state, recordLiveWpm({ second: 2, wpm: 51 }));
      expect(state.wpmTimeline).toEqual([
        { second: 1, wpm: 45, words: [] },
        { second: 2, wpm: 51, words: [] },
      ]);
    });
  });

  describe("wpmHistory reset", () => {
    it("startFromHome resets wpmHistory", () => {
      const state = typingReducer(
        {
          ...initialState,
          wpmHistory: [{ second: 1, totalTyped: 5, errors: 0 }],
        },
        startFromHome({ wordCount: 10 }),
      );
      expect(state.wpmHistory).toEqual([]);
    });

    it("navigateHome resets wpmHistory", () => {
      const state = typingReducer(
        {
          ...initialState,
          wpmHistory: [{ second: 1, totalTyped: 5, errors: 0 }],
        },
        navigateHome(),
      );
      expect(state.wpmHistory).toEqual([]);
    });

    it("resetToReady resets wpmHistory", () => {
      const state = typingReducer(
        {
          ...initialState,
          wpmHistory: [{ second: 1, totalTyped: 5, errors: 0 }],
        },
        resetToReady(),
      );
      expect(state.wpmHistory).toEqual([]);
    });

    it("refreshTest resets wpmHistory", () => {
      const state = typingReducer(
        {
          ...initialState,
          wpmHistory: [{ second: 1, totalTyped: 5, errors: 0 }],
        },
        refreshTest({ wordCount: 50, wordBankSlug: null }),
      );
      expect(state.wpmHistory).toEqual([]);
    });
  });

  describe("selectWpmHistory", () => {
    it("returns wpmHistory", () => {
      const history = [{ second: 1, totalTyped: 5, errors: 0 }];
      const state = { typing: { ...initialState, wpmHistory: history } };
      expect(selectWpmHistory(state)).toEqual(history);
    });
  });

  describe("live metric selectors", () => {
    it("selectLiveWpm returns the live WPM value", () => {
      const state = { typing: { ...initialState, liveWpm: 42.5 } };
      expect(selectLiveWpm(state)).toBe(42.5);
    });

    it("selectWpmTimeline returns the chart timeline", () => {
      const timeline = [{ second: 1, wpm: 60, words: [] }];
      const state = { typing: { ...initialState, wpmTimeline: timeline } };
      expect(selectWpmTimeline(state)).toEqual(timeline);
    });

    it("selectKeystrokes returns the keystroke log", () => {
      const keystrokes = [{ timestamp: 1, charIndex: 0 }];
      const state = { typing: { ...initialState, keystrokes } };
      expect(selectKeystrokes(state)).toEqual(keystrokes);
    });

    it("selectLiveWpmReady is false before the window has enough data", () => {
      const state = {
        typing: {
          ...initialState,
          keystrokes: [{ timestamp: 0, charIndex: 0 }],
        },
      };
      expect(selectLiveWpmReady(state)).toBe(false);
    });

    it("selectLiveWpmReady is true once the window validates", () => {
      const state = {
        typing: {
          ...initialState,
          keystrokes: Array.from({ length: 12 }, (_, i) => ({
            timestamp: i * 200,
            charIndex: i,
          })),
        },
      };
      expect(selectLiveWpmReady(state)).toBe(true);
    });
  });

  describe("live metric reset", () => {
    it("startFromHome resets keystrokes, liveWpm, and timeline", () => {
      const state = typingReducer(
        {
          ...initialState,
          keystrokes: [{ timestamp: 1, charIndex: 0 }],
          liveWpm: 55,
          wpmTimeline: [{ second: 1, wpm: 60, words: [] }],
        },
        startFromHome({ wordCount: 10 }),
      );
      expect(state.keystrokes).toEqual([]);
      expect(state.liveWpm).toBe(0);
      expect(state.wpmTimeline).toEqual([]);
    });

    it("resetToReady resets keystrokes, liveWpm, and timeline", () => {
      const state = typingReducer(
        {
          ...initialState,
          keystrokes: [{ timestamp: 1, charIndex: 0 }],
          liveWpm: 55,
          wpmTimeline: [{ second: 1, wpm: 60, words: [] }],
        },
        resetToReady(),
      );
      expect(state.keystrokes).toEqual([]);
      expect(state.liveWpm).toBe(0);
      expect(state.wpmTimeline).toEqual([]);
    });
  });

  describe("pauseTest / resumeTest guards", () => {
    it("pauseTest does nothing when not active", () => {
      const state = typingReducer(initialState, pauseTest());
      expect(state.status).toBe("idle");
    });

    it("resumeTest does nothing when not paused", () => {
      const state = typingReducer(
        { ...initialState, status: "active" as const },
        resumeTest(),
      );
      expect(state.status).toBe("active");
    });
  });

  describe("startTest", () => {
    it("uses existing word count when no payload is provided", () => {
      const state = typingReducer(
        { ...initialState, wordCount: 10 },
        startTest({}),
      );
      expect(state.wordCount).toBe(10);
      const words = state.targetText.split(" ");
      expect(words.length).toBe(10);
    });
  });

  describe("selectFinalErrors", () => {
    it("returns 0 when there are matching characters", () => {
      const state = {
        typing: { ...initialState, typedText: "hello", targetText: "hello" },
      };
      expect(selectFinalErrors(state)).toBe(0);
    });

    it("counts characters that differ from the target", () => {
      const state = {
        typing: { ...initialState, typedText: "hxllo", targetText: "hello" },
      };
      expect(selectFinalErrors(state)).toBe(1);
    });

    it("ignores typed text beyond target length", () => {
      const state = {
        typing: { ...initialState, typedText: "hello!!!", targetText: "hello" },
      };
      expect(selectFinalErrors(state)).toBe(0);
    });
  });
});
