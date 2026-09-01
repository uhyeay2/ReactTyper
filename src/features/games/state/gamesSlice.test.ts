import { describe, it, expect } from "vitest";
import wordDropReducer, {
  startGame,
  addWord,
  setNextWord,
  removeActiveWord,
  setTyped,
  appendCompleted,
  setMetrics,
  setElapsedTime,
  setGameStatus,
  completeGame,
  resetGame,
  selectWordDropStatus,
  selectWordDropWords,
  selectWordDropNextWord,
  selectWordDropTyped,
  selectWordDropCompleted,
  selectWordDropMetrics,
  selectWordDropElapsed,
  selectWordDropResults,
} from "../state/gamesSlice";
import type { WordDropState, WordDropMetrics } from "../state/gamesTypes";

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

const sampleMetrics: WordDropMetrics = {
  accuracy: 90,
  correctCharacters: 90,
  incorrectCharacters: 10,
  totalCharactersTyped: 100,
  wordsCompleted: 4,
  wordsPerfect: 3,
  wordsCorrected: 0,
  wordsErrored: 1,
  score: 320,
  elapsedTime: 5,
  maxWordsReached: false,
  averageWpm: 60,
  highestWpm: 80,
  lowestWpm: 40,
};

describe("wordDropSlice", () => {
  it("starts a game with the provided initial words, next word, and context", () => {
    const state = wordDropReducer(
      initialState,
      startGame({
        words: [{ id: 1, text: "hello" }],
        nextWord: "world",
        sessionContext: { ...initialState.sessionContext, timeLimit: 60 },
      }),
    );
    expect(state.status).toBe("ready");
    expect(state.words).toEqual([{ id: 1, text: "hello" }]);
    expect(state.nextWord).toBe("world");
    expect(state.typed).toBe("");
    expect(state.sessionContext.timeLimit).toBe(60);
    expect(state.completed).toEqual([]);
    expect(state.metrics.score).toBe(0);
  });

  it("updates the previewed next word", () => {
    const state = wordDropReducer(
      { ...initialState, status: "active" },
      setNextWord("fern"),
    );
    expect(state.nextWord).toBe("fern");
  });

  it("reflects typed characters", () => {
    const state = wordDropReducer(
      { ...initialState, status: "active", words: [{ id: 1, text: "hello" }] },
      setTyped("hel"),
    );
    expect(state.typed).toBe("hel");
  });

  it("adds a word to the top of the stack", () => {
    const state = wordDropReducer(
      { ...initialState, status: "active", words: [{ id: 1, text: "the" }] },
      addWord({ id: 2, text: "cat" }),
    );
    expect(state.words).toHaveLength(2);
    expect(state.words[0]!.text).toBe("the");
    expect(state.words[1]!.text).toBe("cat");
  });

  it("removes the active word and clears the typed buffer", () => {
    const state = wordDropReducer(
      {
        ...initialState,
        status: "active",
        words: [
          { id: 1, text: "the" },
          { id: 2, text: "cat" },
        ],
        typed: "the",
        bufferError: true,
      },
      removeActiveWord(),
    );
    expect(state.words).toEqual([{ id: 2, text: "cat" }]);
    expect(state.typed).toBe("");
    expect(state.bufferError).toBe(false);
  });

  it("does nothing when removing the active word on an empty stack", () => {
    const state = wordDropReducer(
      { ...initialState, status: "active" },
      removeActiveWord(),
    );
    expect(state.words).toEqual([]);
  });

  it("appends a completed word in order", () => {
    const first = wordDropReducer(
      { ...initialState, status: "active" },
      appendCompleted({
        completed: {
          id: 1,
          word: "the",
          quality: "perfect",
          completedAt: 2,
          wpm: 70,
        },
      }),
    ).completed;
    const second = wordDropReducer(
      { ...initialState, status: "active", completed: first },
      appendCompleted({
        completed: {
          id: 2,
          word: "cat",
          quality: "corrected",
          completedAt: 4,
          wpm: 50,
        },
      }),
    ).completed;
    expect(second).toHaveLength(2);
    expect(second[0]!.word).toBe("the");
    expect(second[1]!.word).toBe("cat");
  });

  it("sets metrics and elapsed time", () => {
    let state = wordDropReducer(initialState, setMetrics(sampleMetrics));
    expect(state.metrics.score).toBe(320);
    state = wordDropReducer(state, setElapsedTime(7));
    expect(state.elapsedTime).toBe(7);
  });

  it("updates the game status", () => {
    const state = wordDropReducer(initialState, setGameStatus("completed"));
    expect(state.status).toBe("completed");
  });

  it("completes a game and stores results", () => {
    const results = {
      accuracy: 90,
      correctCharacters: 90,
      incorrectCharacters: 10,
      totalCharactersTyped: 100,
      wordsCompleted: 4,
      wordsPerfect: 3,
      wordsCorrected: 0,
      wordsErrored: 1,
      score: 320,
      elapsedTime: 5,
      maxWordsReached: false,
      averageWpm: 60,
      highestWpm: 80,
      lowestWpm: 40,
      timeLimit: null,
      wordLimit: null,
      maxErrors: null,
      isZenMode: false,
      wordBankSlug: null,
      stacked: [],
    };
    const state = wordDropReducer(
      { ...initialState, status: "active" },
      completeGame(results),
    );
    expect(state.status).toBe("completed");
    expect(state.results).toEqual(results);
  });

  it("resets to the initial state", () => {
    const state = wordDropReducer(
      {
        ...initialState,
        status: "active",
        words: [{ id: 1, text: "hello" }],
        completed: [
          {
            id: 1,
            word: "the",
            quality: "perfect" as const,
            completedAt: 1,
            wpm: 70,
          },
        ],
      },
      resetGame(),
    );
    expect(state).toEqual(initialState);
  });

  it("exposes selectors", () => {
    const state: { wordDrop: WordDropState } = {
      wordDrop: {
        ...initialState,
        status: "active",
        words: [{ id: 1, text: "abc" }],
        typed: "a",
        elapsedTime: 3,
      },
    };
    expect(selectWordDropStatus(state)).toBe("active");
    expect(selectWordDropWords(state)).toEqual([{ id: 1, text: "abc" }]);
    expect(selectWordDropNextWord(state)).toBe("");
    expect(selectWordDropTyped(state)).toBe("a");
    expect(selectWordDropCompleted(state)).toEqual([]);
    expect(selectWordDropMetrics(state)).toEqual(initialState.metrics);
    expect(selectWordDropElapsed(state)).toBe(3);
    expect(selectWordDropResults(state)).toBeNull();
  });
});
