import { render, screen, within } from "@testing-library/react";
import type { TypingResults } from "../../state/typingTypes";
import { ResultsDisplay } from "./ResultsDisplay";

const results: TypingResults = {
  wpm: 65,
  grossWpm: 70,
  accuracy: 93,
  correctChars: 300,
  incorrectChars: 4,
  elapsedTime: 60,
  wordStates: [],
};

describe("ResultsDisplay", () => {
  it("renders headline metrics", () => {
    render(
      <ResultsDisplay
        results={results}
        targetText="hello"
        typedText="hello"
        currentIndex={5}
        fixedChars=""
        wpmTimeline={[{ second: 1, wpm: 60, words: [] }]}
      />,
    );

    expect(screen.getByText("Test Complete")).toBeInTheDocument();
    expect(screen.getByText("WPM")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByText("Raw WPM")).toBeInTheDocument();
    expect(screen.getByText("93%")).toBeInTheDocument();
  });

  it("renders details", () => {
    render(
      <ResultsDisplay
        results={results}
        targetText="hello"
        typedText="hello"
        currentIndex={5}
        fixedChars=""
        wpmTimeline={[]}
      />,
    );

    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("Errors")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("renders typed words review section", () => {
    render(
      <ResultsDisplay
        results={results}
        targetText="hello"
        typedText="hello"
        currentIndex={5}
        fixedChars=""
        wpmTimeline={[]}
      />,
    );

    expect(screen.getByText("Your Typed Words")).toBeInTheDocument();
    expect(screen.getByLabelText("Typed test text review")).toBeInTheDocument();
  });

  it("renders wpm over time section", () => {
    render(
      <ResultsDisplay
        results={results}
        targetText="hello"
        typedText="hello"
        currentIndex={5}
        fixedChars=""
        wpmTimeline={[{ second: 1, wpm: 60, words: [] }]}
      />,
    );

    expect(screen.getByText("WPM Over Time")).toBeInTheDocument();
    expect(screen.getByLabelText("WPM over time graph")).toBeInTheDocument();
  });

  it("renders per-word WPM labels matching the word states", () => {
    render(
      <ResultsDisplay
        results={{
          ...results,
          wordStates: [
            {
              wordText: "hello",
              startCharIndex: 0,
              endCharIndex: 4,
              second: 1,
              wpm: 42,
            },
          ],
        }}
        targetText="hello"
        typedText="hello"
        currentIndex={5}
        fixedChars=""
        wpmTimeline={[]}
      />,
    );

    expect(screen.getByText("Your Typed Words")).toBeInTheDocument();
    const review = screen.getByLabelText("Typed test text review");
    expect(within(review).getByText("42 WPM")).toBeInTheDocument();
  });
});
