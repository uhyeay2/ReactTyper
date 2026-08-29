import { render, screen } from "@testing-library/react";
import { TypedWordsDisplay } from "./TypedWordsDisplay";

function renderDisplay(props: {
  targetText: string;
  typedText: string;
  currentIndex: number;
  fixedChars: string;
}) {
  render(<TypedWordsDisplay {...props} />);
}

function getChars(): HTMLElement[] {
  return Array.from(
    document
      .querySelector('[aria-label="Typed test text review"]')
      ?.querySelectorAll("span[data-char-index]") ?? [],
  );
}

describe("TypedWordsDisplay", () => {
  it("renders typed characters with correct styling classes", () => {
    renderDisplay({
      targetText: "hello",
      typedText: "hello",
      currentIndex: 5,
      fixedChars: "",
    });

    expect(screen.getByLabelText("Typed test text review")).toBeInTheDocument();
    const chars = getChars();
    expect(chars.length).toBe(5);
    chars.forEach((el) => {
      expect(el.className).toContain("correct");
    });
  });

  it("marks incorrect characters", () => {
    renderDisplay({
      targetText: "hello",
      typedText: "hbllo",
      currentIndex: 5,
      fixedChars: "",
    });

    const chars = getChars();
    expect(chars.length).toBe(5);
    expect(chars[1]!.textContent).toBe("b");
    expect(chars[1]!.className).toContain("incorrect");
    expect(
      chars.filter(
        (el) =>
          el.className.includes("correct") &&
          !el.className.includes("incorrect"),
      ).length,
    ).toBe(4);
  });

  it("marks fixed characters", () => {
    renderDisplay({
      targetText: "hello",
      typedText: "hello",
      currentIndex: 5,
      fixedChars: "01000",
    });

    const chars = getChars();
    expect(chars[1]!.className).toContain("fixed");
  });

  it("does not render characters beyond typed length", () => {
    renderDisplay({
      targetText: "hello world",
      typedText: "hello",
      currentIndex: 5,
      fixedChars: "",
    });

    const chars = getChars();
    expect(chars.length).toBe(5);
    expect(chars.every((el) => el.textContent !== "w")).toBe(true);
  });

  it("shows empty message when nothing typed", () => {
    renderDisplay({
      targetText: "hello",
      typedText: "",
      currentIndex: 0,
      fixedChars: "",
    });
    expect(screen.getByText("No words typed")).toBeInTheDocument();
    expect(getChars().length).toBe(0);
  });

  it("treats unprocessed characters as pending state", () => {
    renderDisplay({
      targetText: "hello world",
      typedText: "hello",
      currentIndex: 0,
      fixedChars: "",
    });

    const chars = getChars();
    expect(chars.length).toBe(5);
    chars.forEach((el) => {
      expect(el.className).not.toContain("correct");
      expect(el.className).not.toContain("incorrect");
      expect(el.className).not.toContain("fixed");
    });
  });

  it("skips empty words from trailing spaces", () => {
    renderDisplay({
      targetText: "hello",
      typedText: "hello ",
      currentIndex: 5,
      fixedChars: "",
    });

    const chars = getChars();
    expect(chars.length).toBe(5);
    expect(chars[0]!.textContent).toBe("h");
  });

  it("renders per-word WPM under each word when word states are provided", () => {
    render(
      <TypedWordsDisplay
        targetText="hello world"
        typedText="hello world"
        currentIndex={11}
        fixedChars=""
        wordStates={[
          {
            wordText: "hello",
            startCharIndex: 0,
            endCharIndex: 4,
            wordWpm: 42,
          },
          {
            wordText: "world",
            startCharIndex: 6,
            endCharIndex: 10,
            wordWpm: 57,
          },
        ]}
      />,
    );

    expect(screen.getByText("42 wpm")).toBeInTheDocument();
    expect(screen.getByText("57 wpm")).toBeInTheDocument();
  });

  it("renders a placeholder for words without a measurable WPM", () => {
    render(
      <TypedWordsDisplay
        targetText="hello"
        typedText="hello"
        currentIndex={5}
        fixedChars=""
        wordStates={[
          {
            wordText: "hello",
            startCharIndex: 0,
            endCharIndex: 4,
            wordWpm: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("\u2013")).toBeInTheDocument();
  });

  it("renders no WPM labels when word states are not provided", () => {
    renderDisplay({
      targetText: "hello world",
      typedText: "hello world",
      currentIndex: 11,
      fixedChars: "",
    });

    expect(screen.queryByText(/wpm$/)).toBeNull();
  });
});
