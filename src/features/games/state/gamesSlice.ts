import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  WordDropState,
  WordDropStatus,
  WordDropMetrics,
  WordDropStackedWord,
  WordDropQueuedWord,
  WordDropResults,
  WordDropSessionContext,
} from "./gamesTypes";

const initialState: WordDropState = {
  status: "idle",
  words: [],
  nextWord: "",
  typed: "",
  completed: [],
  metrics: {
    accuracy: 100,
    correctCharacters: 0,
    incorrectCharacters: 0,
    totalCharactersTyped: 0,
    wordsCompleted: 0,
    wordsPerfect: 0,
    wordsCorrected: 0,
    wordsErrored: 0,
    score: 0,
    elapsedTime: 0,
    maxWordsReached: false,
    averageWpm: 0,
    highestWpm: 0,
    lowestWpm: 0,
  },
  elapsedTime: 0,
  bufferError: false,
  results: null,
  sessionContext: {
    timeLimit: null,
    wordLimit: null,
    maxErrors: null,
    isZenMode: false,
    wordBankSlug: null,
  },
};

const wordDropSlice = createSlice({
  name: "wordDrop",
  initialState,
  reducers: {
    startGame(
      state,
      action: PayloadAction<{
        words: WordDropQueuedWord[];
        nextWord: string;
        sessionContext: WordDropSessionContext;
      }>,
    ) {
      state.status = "ready";
      state.words = action.payload.words;
      state.nextWord = action.payload.nextWord;
      state.typed = "";
      state.completed = [];
      state.metrics = initialState.metrics;
      state.elapsedTime = 0;
      state.bufferError = false;
      state.results = null;
      state.sessionContext = action.payload.sessionContext;
    },
    setGameStatus(state, action: PayloadAction<WordDropStatus>) {
      state.status = action.payload;
    },
    addWord(state, action: PayloadAction<WordDropQueuedWord>) {
      state.words.push(action.payload);
    },
    setNextWord(state, action: PayloadAction<string>) {
      state.nextWord = action.payload;
    },
    removeActiveWord(state) {
      if (state.words.length > 0) {
        state.words.shift();
      }
      state.typed = "";
      state.bufferError = false;
    },
    setTyped(state, action: PayloadAction<string>) {
      state.typed = action.payload;
    },
    appendCompleted(
      state,
      action: PayloadAction<{ completed: WordDropStackedWord }>,
    ) {
      state.completed.push(action.payload.completed);
    },
    setMetrics(state, action: PayloadAction<WordDropMetrics>) {
      state.metrics = action.payload;
    },
    setElapsedTime(state, action: PayloadAction<number>) {
      state.elapsedTime = action.payload;
    },
    setBufferError(state, action: PayloadAction<boolean>) {
      state.bufferError = action.payload;
    },
    completeGame(state, action: PayloadAction<WordDropResults>) {
      state.status = "completed";
      state.results = action.payload;
    },
    resetGame() {
      return { ...initialState };
    },
  },
});

export const {
  startGame,
  setGameStatus,
  addWord,
  setNextWord,
  removeActiveWord,
  setTyped,
  appendCompleted,
  setMetrics,
  setElapsedTime,
  setBufferError,
  completeGame,
  resetGame,
} = wordDropSlice.actions;

export const selectWordDropStatus = (state: {
  wordDrop: WordDropState;
}) => state.wordDrop.status;
export const selectWordDropWords = (state: { wordDrop: WordDropState }) =>
  state.wordDrop.words;
export const selectWordDropNextWord = (state: { wordDrop: WordDropState }) =>
  state.wordDrop.nextWord;
export const selectWordDropTyped = (state: { wordDrop: WordDropState }) =>
  state.wordDrop.typed;
export const selectWordDropCompleted = (state: {
  wordDrop: WordDropState;
}) => state.wordDrop.completed;
export const selectWordDropMetrics = (state: { wordDrop: WordDropState }) =>
  state.wordDrop.metrics;
export const selectWordDropElapsed = (state: { wordDrop: WordDropState }) =>
  state.wordDrop.elapsedTime;
export const selectWordDropBufferError = (state: {
  wordDrop: WordDropState;
}) => state.wordDrop.bufferError;
export const selectWordDropResults = (state: { wordDrop: WordDropState }) =>
  state.wordDrop.results;
export const selectWordDropSessionContext = (state: {
  wordDrop: WordDropState;
}) => state.wordDrop.sessionContext;

export default wordDropSlice.reducer;
