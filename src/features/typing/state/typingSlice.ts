import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TypingState, TypingResults, WpmSnapshot } from "./typingTypes";
import type { Keystroke, WpmTimelinePoint } from "../metrics/wpm";
import { computeLiveWpm, isLiveWpmReady } from "../metrics/wpm";
import { getTargetText } from "../utils/wordList";

const DEFAULT_WORD_COUNT = 50;

export const initialState: TypingState = {
  view: "home",
  status: "idle",
  targetText: getTargetText(DEFAULT_WORD_COUNT),
  typedText: "",
  currentIndex: 0,
  errors: 0,
  correctChars: 0,
  totalTyped: 0,
  startTime: null,
  elapsedTime: 0,
  results: null,
  wordCount: DEFAULT_WORD_COUNT,
  fixedChars: "",
  pausedElapsed: 0,
  wpmHistory: [],
  keystrokes: [],
  liveWpm: 0,
  wpmTimeline: [],
};

const typingSlice = createSlice({
  name: "typing",
  initialState,
  reducers: {
    navigateHome() {
      return { ...initialState };
    },
    startFromHome(state, action: PayloadAction<{ wordCount: number }>) {
      const wc = action.payload.wordCount;
      state.view = "test";
      state.status = "ready";
      state.targetText = getTargetText(wc);
      state.typedText = "";
      state.currentIndex = 0;
      state.errors = 0;
      state.correctChars = 0;
      state.totalTyped = 0;
      state.startTime = null;
      state.elapsedTime = 0;
      state.results = null;
      state.wordCount = wc;
      state.fixedChars = "";
      state.pausedElapsed = 0;
      state.wpmHistory = [];
      state.keystrokes = [];
      state.liveWpm = 0;
      state.wpmTimeline = [];
    },
    readyTest(state) {
      state.status = "ready";
    },
    startReadyTest(state) {
      if (state.status !== "ready") return;
      state.status = "active";
      state.startTime = Date.now();
    },
    startTest(state, action: PayloadAction<number | undefined>) {
      const wordCount = action.payload ?? state.wordCount;
      return {
        ...initialState,
        view: "test",
        status: "active",
        targetText: getTargetText(wordCount),
        wordCount,
        startTime: Date.now(),
        fixedChars: "",
      };
    },
    recordWpmSnapshot(state, action: PayloadAction<WpmSnapshot>) {
      const last = state.wpmHistory[state.wpmHistory.length - 1];
      if (last && last.second === action.payload.second) {
        last.totalTyped = action.payload.totalTyped;
        last.errors = action.payload.errors;
        return;
      }
      state.wpmHistory.push(action.payload);
    },
    recordLiveWpm(
      state,
      action: PayloadAction<{ second: number; wpm: number }>,
    ) {
      const last = state.wpmTimeline[state.wpmTimeline.length - 1];
      if (last && last.second === action.payload.second) {
        last.wpm = action.payload.wpm;
        return;
      }
      state.wpmTimeline.push({
        second: action.payload.second,
        wpm: action.payload.wpm,
        words: [],
      });
    },
    updateTypedText(
      state,
      action: PayloadAction<{
        typedText: string;
        currentIndex: number;
        correctChars: number;
        errors: number;
        totalTyped: number;
        fixedChars: string;
        keystroke: Keystroke | null;
      }>,
    ) {
      state.typedText = action.payload.typedText;
      state.currentIndex = action.payload.currentIndex;
      state.correctChars = action.payload.correctChars;
      state.errors = action.payload.errors;
      state.totalTyped = action.payload.totalTyped;
      state.fixedChars = action.payload.fixedChars;

      if (action.payload.keystroke === null) {
        state.keystrokes.pop();
      } else {
        state.keystrokes.push(action.payload.keystroke);
      }
      state.liveWpm = computeLiveWpm(state.keystrokes, state.liveWpm);
    },
    refreshLiveWpm(state) {
      state.liveWpm = computeLiveWpm(state.keystrokes, state.liveWpm);
    },
    appendTargetWords(
      state,
      action: PayloadAction<{ targetText: string; wordCount: number }>,
    ) {
      state.targetText = action.payload.targetText;
      state.wordCount = action.payload.wordCount;
    },
    setElapsedTime(state, action: PayloadAction<number>) {
      state.elapsedTime = action.payload;
    },
    pauseTest(state) {
      if (state.status !== "active") return;
      state.status = "paused";
      state.pausedElapsed = state.elapsedTime;
    },
    resumeTest(state) {
      if (state.status !== "paused") return;
      state.status = "active";
    },
    completeTest(
      state,
      action: PayloadAction<{
        results: TypingResults;
        wpmTimeline: WpmTimelinePoint[];
      }>,
    ) {
      state.status = "completed";
      state.results = action.payload.results;
      state.wpmTimeline = action.payload.wpmTimeline;
    },
    resetToReady(state) {
      state.status = "ready";
      state.typedText = "";
      state.currentIndex = 0;
      state.errors = 0;
      state.correctChars = 0;
      state.totalTyped = 0;
      state.startTime = null;
      state.elapsedTime = 0;
      state.results = null;
      state.fixedChars = "";
      state.pausedElapsed = 0;
      state.wpmHistory = [];
      state.keystrokes = [];
      state.liveWpm = 0;
      state.wpmTimeline = [];
    },
    refreshTest(state) {
      const wordCount = state.wordCount;
      return {
        ...initialState,
        view: "test",
        status: "ready",
        targetText: getTargetText(wordCount),
        wordCount,
      };
    },
  },
});

export const {
  navigateHome,
  startFromHome,
  readyTest,
  startReadyTest,
  startTest,
  updateTypedText,
  refreshLiveWpm,
  appendTargetWords,
  setElapsedTime,
  pauseTest,
  resumeTest,
  completeTest,
  recordWpmSnapshot,
  recordLiveWpm,
  resetToReady,
  refreshTest,
} = typingSlice.actions;

export const selectView = (state: { typing: TypingState }) => state.typing.view;
export const selectTypingStatus = (state: { typing: TypingState }) =>
  state.typing.status;
export const selectTargetText = (state: { typing: TypingState }) =>
  state.typing.targetText;
export const selectTypedText = (state: { typing: TypingState }) =>
  state.typing.typedText;
export const selectCurrentIndex = (state: { typing: TypingState }) =>
  state.typing.currentIndex;
export const selectErrors = (state: { typing: TypingState }) =>
  state.typing.errors;
export const selectCorrectChars = (state: { typing: TypingState }) =>
  state.typing.correctChars;
export const selectTotalTyped = (state: { typing: TypingState }) =>
  state.typing.totalTyped;
export const selectStartTime = (state: { typing: TypingState }) =>
  state.typing.startTime;
export const selectElapsedTime = (state: { typing: TypingState }) =>
  state.typing.elapsedTime;
export const selectResults = (state: { typing: TypingState }) =>
  state.typing.results;
export const selectFixedChars = (state: { typing: TypingState }) =>
  state.typing.fixedChars;
export const selectPausedElapsed = (state: { typing: TypingState }) =>
  state.typing.pausedElapsed;
export const selectWpmHistory = (state: { typing: TypingState }) =>
  state.typing.wpmHistory;
export const selectLiveWpm = (state: { typing: TypingState }) =>
  state.typing.liveWpm;
export const selectLiveWpmReady = (state: { typing: TypingState }) =>
  isLiveWpmReady(state.typing.keystrokes);
export const selectWpmTimeline = (state: { typing: TypingState }) =>
  state.typing.wpmTimeline;
export const selectKeystrokes = (state: { typing: TypingState }) =>
  state.typing.keystrokes;

export const selectFinalErrors = (state: { typing: TypingState }) => {
  const { targetText, typedText } = state.typing;
  let errors = 0;
  for (let i = 0; i < typedText.length && i < targetText.length; i++) {
    if (typedText[i] !== targetText[i]) errors++;
  }
  return errors;
};

export default typingSlice.reducer;
