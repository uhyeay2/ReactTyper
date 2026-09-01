import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { setWordCount, setMaxErrors } from "@/features/typingConfig/state/typingConfigSlice";
import { completeGame } from "../state/gamesSlice";
import { useWordDrop } from "./useWordDrop";

const wordQueue: string[] = [];
let queueIndex = 0;

vi.mock("../services/wordDropSource", () => ({
  getNextGameWord: vi.fn(() => {
    const word = wordQueue[queueIndex % wordQueue.length] ?? "the";
    queueIndex += 1;
    return word;
  }),
}));

function createStore() {
  return configureStore({ reducer: rootReducer });
}

function TestComponent() {
  const {
    status,
    typed,
    words,
    metrics,
    results,
    handleStart,
    handleKeyDown,
  } = useWordDrop();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="typed">{typed}</span>
      <span data-testid="queue">{words.length}</span>
      <span data-testid="score">{metrics.score}</span>
      <span data-testid="words">{metrics.wordsCompleted}</span>
      <span data-testid="perfect">{metrics.wordsPerfect}</span>
      <span data-testid="corrected">{metrics.wordsCorrected}</span>
      <span data-testid="errored">{metrics.wordsErrored}</span>
      <span data-testid="result">{results ? "has-result" : "none"}</span>
      <span data-testid="result-max">{results ? String(results.maxWordsReached) : ""}</span>
      <button data-testid="start" onClick={handleStart}>
        Start
      </button>
      <input data-testid="input" aria-label="test input" onKeyDown={handleKeyDown} />
    </div>
  );
}

function renderGame(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <TestComponent />
    </Provider>,
  );
}

function typeWord(word: string) {
  for (const char of word) {
    act(() => {
      fireEvent.keyDown(screen.getByTestId("input"), { key: char });
    });
  }
}

describe("useWordDrop", () => {
  beforeEach(() => {
    wordQueue.length = 0;
    queueIndex = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("resets a previously completed game to the settings/start state on mount", () => {
    const store = createStore();
    store.dispatch(
      completeGame({
        accuracy: 90,
        correctCharacters: 9,
        incorrectCharacters: 1,
        totalCharactersTyped: 10,
        wordsCompleted: 2,
        wordsPerfect: 2,
        wordsCorrected: 0,
        wordsErrored: 0,
        score: 100,
        elapsedTime: 30,
        maxWordsReached: false,
        averageWpm: 50,
        highestWpm: 60,
        lowestWpm: 40,
        timeLimit: 60,
        wordLimit: null,
        maxErrors: null,
        isZenMode: false,
        wordBankSlug: null,
        stacked: [],
      }),
    );
    expect(store.getState().wordDrop.status).toBe("completed");

    // mounting the screen must wipe the stale result so Settings show again
    renderGame(store);
    expect(screen.getByTestId("status").textContent).toBe("idle");
    expect(screen.getByTestId("result").textContent).toBe("none");
  });

  it("completes a typed word perfectly, scoring it and immediately spawning the next", () => {
    wordQueue.push("hello");
    const store = createStore();
    renderGame(store);

    fireEvent.click(screen.getByTestId("start"));
    expect(screen.getByTestId("status").textContent).toBe("active");

    typeWord("hello");

    // the completed word is scored, and a fresh word appears without a delay
    expect(screen.getByTestId("queue").textContent).toBe("1");
    expect(screen.getByTestId("words").textContent).toBe("1");
    expect(screen.getByTestId("perfect").textContent).toBe("1");
    expect(screen.getByTestId("score").textContent).toBe("50");
  });

  it("only advances the typed buffer on correct keys", () => {
    wordQueue.push("hello");
    const store = createStore();
    renderGame(store);

    fireEvent.click(screen.getByTestId("start"));

    act(() => fireEvent.keyDown(screen.getByTestId("input"), { key: "x" }));
    // an incorrect key does not advance the typed buffer
    expect(screen.getByTestId("typed").textContent).toBe("");

    for (const char of "hel") {
      act(() => fireEvent.keyDown(screen.getByTestId("input"), { key: char }));
    }
    expect(screen.getByTestId("typed").textContent).toBe("hel");
  });

  it("records a corrected word after fixing a slip with backspace", () => {
    wordQueue.push("hello");
    const store = createStore();
    renderGame(store);

    fireEvent.click(screen.getByTestId("start"));

    act(() => fireEvent.keyDown(screen.getByTestId("input"), { key: "h" }));
    act(() => fireEvent.keyDown(screen.getByTestId("input"), { key: "Backspace" }));
    typeWord("hello");

    expect(screen.getByTestId("corrected").textContent).toBe("1");
    expect(screen.getByTestId("score").textContent).toBe("25");
  });

  it("ends the game successfully when the word limit is reached", () => {
    wordQueue.push("hello");
    const store = createStore();
    store.dispatch(setWordCount(1));
    renderGame(store);

    fireEvent.click(screen.getByTestId("start"));
    typeWord("hello");

    expect(screen.getByTestId("status").textContent).toBe("completed");
    expect(screen.getByTestId("result").textContent).toBe("has-result");
    expect(screen.getByTestId("result-max").textContent).toBe("true");
  });

  it("ends the game when max errors are exceeded, counting the unfinished word as errored", () => {
    wordQueue.push("hello");
    const store = createStore();
    store.dispatch(setMaxErrors(1));
    renderGame(store);

    fireEvent.click(screen.getByTestId("start"));

    act(() => fireEvent.keyDown(screen.getByTestId("input"), { key: "x" }));
    expect(screen.getByTestId("status").textContent).toBe("completed");
    expect(screen.getByTestId("result").textContent).toBe("has-result");
    expect(screen.getByTestId("errored").textContent).toBe("1");
    expect(screen.getByTestId("words").textContent).toBe("0");
  });

  it("spawns the next word immediately when the last word on screen is completed", () => {
    wordQueue.push("hello", "world");
    const store = createStore();
    renderGame(store);

    fireEvent.click(screen.getByTestId("start"));
    expect(screen.getByTestId("queue").textContent).toBe("1");

    typeWord("hello");

    // the queue fired without waiting for the spawn timer
    expect(screen.getByTestId("queue").textContent).toBe("1");
    expect(screen.getByTestId("status").textContent).toBe("active");
    expect(screen.getByTestId("words").textContent).toBe("1");
  });

  it("allows a fourth word on screen without ending the game itself", () => {
    wordQueue.push("the", "cat", "dog", "sun", "fox");
    const store = createStore();
    renderGame(store);

    fireEvent.click(screen.getByTestId("start"));

    // advance the rAF-driven spawn loop well past several spawn intervals
    act(() => {
      vi.advanceTimersByTime(25_000);
    });

    // a fourth word is allowed to spawn and coexist; ending on the stack
    // overflow happens only in the field when that word lands, so the hook
    // itself stays active here.
    expect(screen.getByTestId("queue").textContent).toBe("4");
    expect(screen.getByTestId("status").textContent).toBe("active");
  });
});
