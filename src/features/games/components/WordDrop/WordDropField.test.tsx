import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { WordDropQueuedWord } from "../../state/gamesTypes";
import { WordDropField } from "./WordDropField";
import { LOSE_STACK_SIZE } from "../../utils/wordDropEngine";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WordDropField", () => {
  it("renders the active word's characters with the typed prefix highlighted", () => {
    const words: WordDropQueuedWord[] = [{ id: 1, text: "hello" }];
    const { container } =     render(<WordDropField words={words} typed="he" fallDuration={2} active={false} />);
    expect(screen.getAllByText("h")).toHaveLength(1);
    expect(screen.getAllByText("e")).toHaveLength(1);
    expect(screen.getAllByText("l")).toHaveLength(2);
    expect(screen.getAllByText("o")).toHaveLength(1);
    expect(container.querySelector("[data-testid]")).toBeNull();
  });

  it("renders queued words above the active word", () => {
    const words: WordDropQueuedWord[] = [
      { id: 1, text: "the" },
      { id: 2, text: "cat" },
      { id: 3, text: "sun" },
    ];
    render(<WordDropField words={words} typed="t" fallDuration={2} active={false} />);
    expect(screen.getAllByText("t")).toHaveLength(2);
    expect(screen.getAllByText("h")).toHaveLength(1);
    expect(screen.getAllByText("a")).toHaveLength(1);
    expect(screen.getAllByText("s")).toHaveLength(1);
    expect(screen.getAllByText("u")).toHaveLength(1);
    expect(screen.getAllByText("n")).toHaveLength(1);
  });

  it("renders the danger line and nothing else when the stack is empty", () => {
    render(<WordDropField words={[]} typed="" fallDuration={2} active={false} />);
    expect(screen.queryByText(/^[a-z]+$/)).toBeNull();
  });

  it("calls onStackOverflow once a fourth word has visually landed", () => {
    const words: WordDropQueuedWord[] = [
      { id: 1, text: "the" },
      { id: 2, text: "cat" },
      { id: 3, text: "dog" },
      { id: 4, text: "sun" },
    ];
    const overflow = vi.fn();

    // Drive the fall with synthetic frames so the fourth word settles.
    vi.spyOn(performance, "now").mockReturnValue(0);
    let frame = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frame += 1;
      if (frame <= 200) cb(frame * 16);
      return frame;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    render(
      <WordDropField
        words={words}
        typed=""
        fallDuration={0.3}
        active={true}
        onStackOverflow={overflow}
      />,
    );

    act(() => {});
    expect(overflow).toHaveBeenCalledTimes(1);
    expect(words.length).toBe(LOSE_STACK_SIZE);
  });
});
