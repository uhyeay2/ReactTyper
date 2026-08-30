import { fireEvent, render, screen, within } from "@testing-library/react";
import type { TypingTestResult } from "../../state/historyTypes";
import { HistoryDetail } from "./HistoryDetail";

function makeResult(
  overrides: Partial<TypingTestResult> = {},
): TypingTestResult {
  return {
    publicId: "result-1",
    sessionType: 0,
    wpm: 65,
    rawWpm: 70,
    accuracy: 93,
    correctCharacterCount: 300,
    incorrectCharacterCount: 4,
    totalCharacterCount: 304,
    durationSeconds: 60,
    wordCount: 60,
    totalWordsTyped: 60,
    wordsTypedWithErrors: 2,
    wordsTypedWithCorrections: 3,
    wordsTypedPerfectly: 55,
    highestWpm: 82,
    lowestWpm: 44,
    averageWpm: 62,
    durationLimitSeconds: null,
    maxWords: null,
    maxErrors: null,
    isZenMode: false,
    wordBankSlug: null,
    lessonSlug: null,
    lessonUnitOrder: null,
    completedAtUtc: "2026-01-15T10:30:00.000Z",
    typedWords: [
      {
        wordText: "alpha",
        second: 1,
        wpm: 60,
        charStates: ["correct", "correct", "correct", "correct", "correct"],
      },
      {
        wordText: "beta",
        second: 2,
        wpm: 70,
        charStates: ["correct", "correct", "correct", "correct"],
      },
    ],
    wpmTimeline: [
      { second: 1, wpm: 60 },
      { second: 2, wpm: 70 },
      { second: 3, wpm: 80 },
    ],
    ...overrides,
  };
}

describe("HistoryDetail", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("invokes onBack when the back button is clicked", () => {
    const onBack = vi.fn();
    render(<HistoryDetail result={makeResult()} onBack={onBack} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Back to history/ }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows the session type and the saved timestamp", () => {
    render(<HistoryDetail result={makeResult()} onBack={vi.fn()} />);

    expect(screen.getByText("Typing Test")).toBeInTheDocument();
    expect(
      screen.getByText(new Date("2026-01-15T10:30:00.000Z").toLocaleString()),
    ).toBeInTheDocument();
  });

  it("renders the headline metrics like the post-test review", () => {
    render(<HistoryDetail result={makeResult()} onBack={vi.fn()} />);

    expect(screen.getByText("Adjusted WPM")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByText("Raw WPM")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("93%")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
  });

  it("hides Extra Details and Your Typed Words by default", () => {
    render(<HistoryDetail result={makeResult()} onBack={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /Extra Details/ }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: /Your Typed Words/ }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Total Words Typed")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Typed test text review"),
    ).not.toBeInTheDocument();
  });

  it("shows the WPM over time line graph by default", () => {
    render(<HistoryDetail result={makeResult()} onBack={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /WPM Over Time/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("WPM over time graph")).toBeInTheDocument();
    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.querySelector("polyline")).not.toBeNull();
  });

  it("does not render the previous bar-chart based view", () => {
    render(<HistoryDetail result={makeResult()} onBack={vi.fn()} />);

    expect(screen.queryByText("Metrics")).not.toBeInTheDocument();
    expect(document.querySelector(".bar")).toBeNull();
  });

  it("expands Extra Details to reveal the saved metrics", () => {
    render(<HistoryDetail result={makeResult()} onBack={vi.fn()} />);

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
  });

  it("expands Your Typed Words to reveal saved words with WPM labels", () => {
    render(<HistoryDetail result={makeResult()} onBack={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Your Typed Words/ }),
    );

    const review = screen.getByLabelText("Typed test text review");
    expect(review).toBeInTheDocument();
    expect(review.textContent).toContain("alpha");
    expect(review.textContent).toContain("beta");
    expect(within(review).getByText("60 WPM")).toBeInTheDocument();
    expect(within(review).getByText("70 WPM")).toBeInTheDocument();
  });
});