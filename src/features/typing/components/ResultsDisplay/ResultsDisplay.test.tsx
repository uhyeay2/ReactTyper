import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import type { TypingResults } from "../../state/typingTypes";
import { ResultsDisplay } from "./ResultsDisplay";

const results: TypingResults = {
  wpm: 65,
  grossWpm: 70,
  accuracy: 93,
  correctChars: 300,
  incorrectChars: 4,
  elapsedTime: 60,
  totalWordsTyped: 60,
  wordsTypedWithErrors: 2,
  wordsTypedWithCorrections: 3,
  wordsTypedPerfectly: 55,
  highestWpm: 82,
  lowestWpm: 44,
  averageWpm: 62,
  wordStates: [],
  charStates: [],
};

const baseProps: ComponentProps<typeof ResultsDisplay> = {
  results,
  targetText: "hello",
  typedText: "hello",
  currentIndex: 5,
  fixedChars: "",
  wpmTimeline: [{ second: 1, wpm: 60, words: [] }],
};

function renderResults(
  props?: Partial<ComponentProps<typeof ResultsDisplay>>,
) {
  return render(<ResultsDisplay {...baseProps} {...props} />);
}

function getDetailValue(label: string): HTMLElement {
  const item = screen.getByText(label).closest("div");
  return within(item!).getByText(/^\d+/) as HTMLElement;
}

describe("ResultsDisplay", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders headline metrics", () => {
    renderResults();

    expect(screen.getByText("Test Complete")).toBeInTheDocument();
    expect(screen.getByText("Adjusted WPM")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByText("Raw WPM")).toBeInTheDocument();
    expect(screen.getByText("93%")).toBeInTheDocument();
  });

  it("renders detailed word and speed stats when expanded", () => {
    renderResults();

    fireEvent.click(
      screen.getByRole("button", { name: /Extra Details/ }),
    );

    expect(screen.getByText("Total Words Typed")).toBeInTheDocument();
    expect(screen.getByText("Words With Errors")).toBeInTheDocument();
    expect(screen.getByText("Words With Corrections")).toBeInTheDocument();
    expect(screen.getByText("Words Typed Perfectly")).toBeInTheDocument();
    expect(screen.getByText("Time Typed")).toBeInTheDocument();
    expect(screen.getByText("Lowest WPM")).toBeInTheDocument();
    expect(screen.getByText("Highest WPM")).toBeInTheDocument();
    expect(screen.getByText("Average WPM")).toBeInTheDocument();

    expect(getDetailValue("Total Words Typed")).toHaveTextContent("60");
    expect(getDetailValue("Words With Errors")).toHaveTextContent("2");
    expect(getDetailValue("Words With Corrections")).toHaveTextContent("3");
    expect(getDetailValue("Words Typed Perfectly")).toHaveTextContent("55");
    expect(getDetailValue("Time Typed")).toHaveTextContent("60s");
    expect(getDetailValue("Lowest WPM")).toHaveTextContent("44");
    expect(getDetailValue("Highest WPM")).toHaveTextContent("82");
    expect(getDetailValue("Average WPM")).toHaveTextContent("62");
  });

  it("hides the extra details by default", () => {
    renderResults();

    expect(screen.queryByText("Total Words Typed")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Extra Details/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("expands and collapses the extra details", () => {
    renderResults();

    fireEvent.click(
      screen.getByRole("button", { name: /Extra Details/ }),
    );
    expect(screen.getByText("Total Words Typed")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Extra Details/ }),
    );
    expect(screen.queryByText("Total Words Typed")).not.toBeInTheDocument();
  });

  it("hides the typed words review by default", () => {
    renderResults();

    expect(
      screen.queryByLabelText("Typed test text review"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Your Typed Words/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("expands and collapses the typed words review", () => {
    renderResults();

    fireEvent.click(
      screen.getByRole("button", { name: /Your Typed Words/ }),
    );
    expect(
      screen.getByLabelText("Typed test text review"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Your Typed Words/ }),
    );
    expect(
      screen.queryByLabelText("Typed test text review"),
    ).not.toBeInTheDocument();
  });

  it("shows the WPM over time graph by default", () => {
    renderResults();

    expect(screen.getByLabelText("WPM over time graph")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /WPM Over Time/ }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses the WPM over time graph", () => {
    renderResults();

    fireEvent.click(
      screen.getByRole("button", { name: /WPM Over Time/ }),
    );
    expect(
      screen.queryByLabelText("WPM over time graph"),
    ).not.toBeInTheDocument();
  });

  it("persists section state across remounts", () => {
    const { unmount } = renderResults();

    fireEvent.click(
      screen.getByRole("button", { name: /Extra Details/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Your Typed Words/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /WPM Over Time/ }),
    );
    unmount();

    renderResults();

    expect(screen.getByText("Total Words Typed")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Typed test text review"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("WPM over time graph"),
    ).not.toBeInTheDocument();
  });

  it("renders per-word WPM labels matching the word states", () => {
    renderResults({
      results: {
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
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Your Typed Words/ }),
    );

    const review = screen.getByLabelText("Typed test text review");
    expect(within(review).getByText("42 WPM")).toBeInTheDocument();
  });
});