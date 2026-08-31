import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TypingConfigState } from "./typingConfigTypes";

const DEFAULT_WORD_BANK_SLUG = "english-top-200";

const initialState: TypingConfigState = {
  duration: 60,
  wordCount: null,
  maxErrors: null,
  isZenMode: false,
  wordBankSlug: DEFAULT_WORD_BANK_SLUG,
};

const typingConfigSlice = createSlice({
  name: "typingConfig",
  initialState,
  reducers: {
    setDuration(state, action: PayloadAction<number | null>) {
      state.duration = action.payload;
      state.isZenMode =
        state.duration === null &&
        state.wordCount === null &&
        state.maxErrors === null;
    },
    setWordCount(state, action: PayloadAction<number | null>) {
      state.wordCount = action.payload;
      state.isZenMode =
        state.duration === null &&
        state.wordCount === null &&
        state.maxErrors === null;
    },
    setMaxErrors(state, action: PayloadAction<number | null>) {
      state.maxErrors = action.payload;
      state.isZenMode =
        state.duration === null &&
        state.wordCount === null &&
        state.maxErrors === null;
    },
    setZenMode(state, action: PayloadAction<boolean>) {
      state.isZenMode = action.payload;
      if (action.payload) {
        state.duration = null;
        state.wordCount = null;
        state.maxErrors = null;
      }
    },
    setWordBankSlug(state, action: PayloadAction<string | null>) {
      state.wordBankSlug = action.payload;
    },
    resetConfig() {
      return initialState;
    },
  },
});

export const {
  setDuration,
  setWordCount,
  setMaxErrors,
  setZenMode,
  setWordBankSlug,
  resetConfig,
} = typingConfigSlice.actions;

export const selectDuration = (state: {
  typingConfig: TypingConfigState;
}) => state.typingConfig.duration;
export const selectWordCount = (state: {
  typingConfig: TypingConfigState;
}) => state.typingConfig.wordCount;
export const selectMaxErrors = (state: {
  typingConfig: TypingConfigState;
}) => state.typingConfig.maxErrors;
export const selectIsZenMode = (state: {
  typingConfig: TypingConfigState;
}) => state.typingConfig.isZenMode;
export const selectWordBankSlug = (state: {
  typingConfig: TypingConfigState;
}) => state.typingConfig.wordBankSlug;
export const selectTypingConfig = (state: {
  typingConfig: TypingConfigState;
}) => state.typingConfig;

export default typingConfigSlice.reducer;
