import { render, screen, within } from "@testing-library/react";
import type { TypedWord } from "../../state/historyTypes";
import { HistoryTypedWords } from "./HistoryTypedWords";

const words: TypedWord[] = [
  {
    wordText: "alpha",
    second: 1,
    wpm: 60,
    charStates: ["correct", "correct", "correct", "correct", "correct"],
  },
  {
    wordText: "bea",
    second: 2,
    wpm: 72,
    charStates: ["correct", "fixed", "incorrect"],
  },
];

function getCharSpans(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll("[data-char-index]"));
}

describe("HistoryTypedWords", () => {
  it("renders each word with its per-word WPM label", () => {
    render(<HistoryTypedWords words={words} />);

    const review = screen.getByLabelText("Typed test text review");
    expect(review).toBeInTheDocument();
    expect(review.textContent).toContain("alpha");
    expect(review.textContent).toContain("bea");
    expect(within(review).getByText("60 WPM")).toBeInTheDocument();
    expect(within(review).getByText("72 WPM")).toBeInTheDocument();
  });

  it("colors characters by their saved state", () => {
    const { container } = render(<HistoryTypedWords words={words} />);

    const chars = getCharSpans(container);
    expect(chars).toHaveLength(8);

    expect(chars[6]!.className).toMatch(/fixed/);
    expect(chars[7]!.className).toMatch(/incorrect/);
    expect(chars[0]!.className).toMatch(/correct/);
    expect(chars[5]!.className).toMatch(/correct/);
  });

  it("renders plain characters when the record lacks char states", () => {
    const legacyWord = {
      wordText: "beta",
      second: 2,
      wpm: 70,
    } as unknown as TypedWord;

    const { container } = render(<HistoryTypedWords words={[legacyWord]} />);

    expect(
      screen.getByLabelText("Typed test text review").textContent,
    ).toContain("beta");
    for (const el of getCharSpans(container)) {
      expect(el.className).not.toMatch(/correct|fixed|incorrect/);
    }
  });

  it("treats unexpected persisted char states as uncolored", () => {
    const malformedWord = {
      wordText: "cat",
      second: 1,
      wpm: 60,
      charStates: ["correct", "unknown", "incorrect"],
    } as unknown as TypedWord;

    const { container } = render(
      <HistoryTypedWords words={[malformedWord]} />,
    );

    expect(container.textContent).toContain("cat");
    const chars = getCharSpans(container);
    expect(chars[0]!.className).toMatch(/correct/);
    expect(chars[1]!.className).not.toMatch(/correct|fixed|incorrect/);
    expect(chars[2]!.className).toMatch(/incorrect/);
  });

  it("shows an empty state when no words were typed", () => {
    render(<HistoryTypedWords words={[]} />);

    expect(screen.getByText("No words typed")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Typed test text review"),
    ).not.toBeInTheDocument();
  });
});