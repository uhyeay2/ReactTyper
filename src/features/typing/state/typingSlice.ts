import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TypingState, TypingResults } from "./typingTypes";
import { getTargetText } from "../utils/wordList";

const DEFAULT_WORD_COUNT = 50;

const initialState: TypingState = {
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
};

const typingSlice = createSlice({
  name: "typing",
  initialState,
  reducers: {
    readyTest(state) {
      if (state.status !== "idle") return;
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
        status: "active",
        targetText: getTargetText(wordCount),
        wordCount,
        startTime: Date.now(),
        fixedChars: "",
      };
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
      }>,
    ) {
      state.typedText = action.payload.typedText;
      state.currentIndex = action.payload.currentIndex;
      state.correctChars = action.payload.correctChars;
      state.errors = action.payload.errors;
      state.totalTyped = action.payload.totalTyped;
      state.fixedChars = action.payload.fixedChars;
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
      }>,
    ) {
      state.status = "completed";
      state.results = action.payload.results;
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
    },
    refreshTest(state) {
      const wordCount = state.wordCount;
      return {
        ...initialState,
        status: "ready",
        targetText: getTargetText(wordCount),
        wordCount,
      };
    },
  },
});

export const {
  readyTest,
  startReadyTest,
  startTest,
  updateTypedText,
  appendTargetWords,
  setElapsedTime,
  pauseTest,
  resumeTest,
  completeTest,
  resetToReady,
  refreshTest,
} = typingSlice.actions;

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

export const selectFinalErrors = (state: { typing: TypingState }) => {
  const { targetText, typedText } = state.typing;
  let errors = 0;
  for (let i = 0; i < typedText.length && i < targetText.length; i++) {
    if (typedText[i] !== targetText[i]) errors++;
  }
  return errors;
};

export default typingSlice.reducer;
