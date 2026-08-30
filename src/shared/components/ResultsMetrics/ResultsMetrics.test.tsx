import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  ResultsMetrics,
  type ResultStats,
} from "./ResultsMetrics";

const stats: ResultStats = {
  adjustedWpm: 65,
  accuracy: 93,
  rawWpm: 70,
  totalWordsTyped: 60,
  wordsTypedWithErrors: 2,
  wordsTypedWithCorrections: 3,
  wordsTypedPerfectly: 55,
  timeTypedSeconds: 60,
  lowestWpm: 44,
  highestWpm: 82,
  averageWpm: 62,
};

function getDetailValue(label: string): HTMLElement {
  const item = screen.getByText(label).closest("div");
  return within(item!).getByText(/^\d+/) as HTMLElement;
}

describe("ResultsMetrics", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the headline metric trio", () => {
    render(<ResultsMetrics stats={stats} />);

    expect(screen.getByText("Adjusted WPM")).toBeInTheDocument();
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByText("Raw WPM")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("93%")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
  });

  it("hides extra details by default", () => {
    render(<ResultsMetrics stats={stats} />);

    expect(screen.queryByText("Total Words Typed")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Extra Details/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("expands and collapses the extra details", () => {
    render(<ResultsMetrics stats={stats} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Extra Details/ }),
    );
    expect(screen.getByText("Total Words Typed")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Extra Details/ }),
    );
    expect(screen.queryByText("Total Words Typed")).not.toBeInTheDocument();
  });

  it("renders every extra detail value when expanded", () => {
    render(<ResultsMetrics stats={stats} />);

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

  it("persists the expanded state across remounts using the default key", () => {
    const { unmount } = render(<ResultsMetrics stats={stats} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Extra Details/ }),
    );
    unmount();

    render(<ResultsMetrics stats={stats} />);

    expect(screen.getByText("Total Words Typed")).toBeInTheDocument();
  });

  it("honours a custom storage key", () => {
    render(
      <ResultsMetrics stats={stats} storageKey="custom-extra-details" />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Extra Details/ }),
    );
    expect(window.localStorage.getItem("custom-extra-details")).toBe("true");
  });
});