import { render, screen } from "@testing-library/react";
import type { TypingResults } from "../../state/typingTypes";
import { ResultsDisplay } from "./ResultsDisplay";

const results: TypingResults = {
  wpm: 65,
  grossWpm: 70,
  accuracy: 93,
  correctChars: 300,
  incorrectChars: 4,
  elapsedTime: 60,
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
        wpmHistory={[{ second: 1, totalTyped: 9, errors: 0 }]}
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
        wpmHistory={[]}
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
        wpmHistory={[]}
      />,
    );

    expect(screen.getByText("Your Typed Words")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Typed test text review"),
    ).toBeInTheDocument();
  });

  it("renders wpm over time section", () => {
    render(
      <ResultsDisplay
        results={results}
        targetText="hello"
        typedText="hello"
        currentIndex={5}
        fixedChars=""
        wpmHistory={[{ second: 1, totalTyped: 9, errors: 0 }]}
      />,
    );

    expect(screen.getByText("WPM Over Time")).toBeInTheDocument();
    expect(
      screen.getByLabelText("WPM over time graph"),
    ).toBeInTheDocument();
  });
});
