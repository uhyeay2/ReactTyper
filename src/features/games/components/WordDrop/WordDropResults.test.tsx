import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { WordDropResults } from "../../state/gamesTypes";
import { WordDropResults as WordDropResultsView } from "./WordDropResults";

const baseResults: WordDropResults = {
  accuracy: 90,
  correctCharacters: 90,
  incorrectCharacters: 10,
  totalCharactersTyped: 100,
  wordsCompleted: 10,
  wordsPerfect: 7,
  wordsCorrected: 2,
  wordsErrored: 1,
  score: 1250,
  elapsedTime: 30,
  maxWordsReached: false,
  averageWpm: 65,
  highestWpm: 90,
  lowestWpm: 40,
  timeLimit: 60,
  wordLimit: null,
  maxErrors: null,
  isZenMode: false,
  wordBankSlug: null,
  stacked: [],
};

describe("WordDropResults", () => {
  it("renders the score and metrics", () => {
    render(
      <WordDropResultsView
        results={baseResults}
        onPlayAgain={vi.fn()}
        onNewWords={vi.fn()}
        onBackToGames={vi.fn()}
      />,
    );
    expect(screen.getByText("1250")).toBeInTheDocument();
    expect(screen.getByText("SCORE")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("7 perfect")).toBeInTheDocument();
    expect(screen.getByText("2 corrected")).toBeInTheDocument();
    expect(screen.getByText("1 errored")).toBeInTheDocument();
  });

  it("shows a word-limit headline when the limit was reached", () => {
    render(
      <WordDropResultsView
        results={{ ...baseResults, maxWordsReached: true }}
        onPlayAgain={vi.fn()}
        onNewWords={vi.fn()}
        onBackToGames={vi.fn()}
      />,
    );
    expect(screen.getByText("Word Limit Reached!")).toBeInTheDocument();
  });

  it("invokes the action handlers", () => {
    const onPlayAgain = vi.fn();
    const onNewWords = vi.fn();
    const onBackToGames = vi.fn();
    render(
      <WordDropResultsView
        results={baseResults}
        onPlayAgain={onPlayAgain}
        onNewWords={onNewWords}
        onBackToGames={onBackToGames}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Play Again" }));
    fireEvent.click(screen.getByRole("button", { name: "New Words" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to Games" }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(onNewWords).toHaveBeenCalledTimes(1);
    expect(onBackToGames).toHaveBeenCalledTimes(1);
  });
});
