import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import { completeGame } from "../../state/gamesSlice";
import type { WordDropResults } from "../../state/gamesTypes";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/features/typingConfig/services/wordBanksApi", () => ({
  apiListWordBanks: vi.fn(() => new Promise(() => {})),
  apiGetWordBank: vi.fn(),
}));

vi.mock("@/features/typing/utils/wordBankLoader", () => ({
  loadWordBankWords: vi.fn(() => Promise.resolve(true)),
  clearWordBankCache: vi.fn(),
}));

import { WordDrop } from "./WordDrop";

function createStore() {
  return configureStore({ reducer: rootReducer });
}

function renderScreen(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <WordDrop />
    </Provider>,
  );
}

const results: Omit<WordDropResults, "elapsedTime" | "timeLimit" | "wordLimit" | "maxErrors" | "isZenMode" | "wordBankSlug" | "stacked"> =
  {
    accuracy: 90,
    correctCharacters: 90,
    incorrectCharacters: 10,
    totalCharactersTyped: 100,
    wordsCompleted: 5,
    wordsPerfect: 4,
    wordsCorrected: 0,
    wordsErrored: 1,
    score: 700,
    maxWordsReached: false,
    averageWpm: 60,
    highestWpm: 80,
    lowestWpm: 40,
  };

const fullResults: WordDropResults = {
  ...results,
  elapsedTime: 20,
  timeLimit: null,
  wordLimit: null,
  maxErrors: null,
  isZenMode: false,
  wordBankSlug: null,
  stacked: [],
};

describe("WordDrop screen", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renders the settings screen with a start button when idle", () => {
    renderScreen(createStore());
    expect(screen.getByText("Word Drop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
  });

  it("navigates back to games", () => {
    renderScreen(createStore());
    fireEvent.click(screen.getByRole("button", { name: "Back to Games" }));
    expect(mockNavigate).toHaveBeenCalledWith("/games");
  });

  it("resets any prior completed game to the settings screen on mount", () => {
    const store = createStore();
    store.dispatch(completeGame(fullResults));
    renderScreen(store);
    // arriving at the screen must not resurface the previous result
    expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play Again" })).toBeNull();
  });

  it("shows results when a game completes during the session", () => {
    const store = createStore();
    renderScreen(store);
    act(() => {
      store.dispatch(completeGame(fullResults));
    });
    expect(screen.getByText("700")).toBeInTheDocument();
    expect(screen.getByText("SCORE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
  });
});
