import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WordDropInput } from "./WordDropInput";

describe("WordDropInput", () => {
  it("forwards key-down events to the handler", () => {
    const onKeyDown = vi.fn();
    render(<WordDropInput active onKeyDown={onKeyDown} />);
    fireEvent.keyDown(screen.getByLabelText("Word Drop typing input"), {
      key: "a",
    });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("renders child content", () => {
    render(
      <WordDropInput active onKeyDown={vi.fn()}>
        <span>falling word</span>
      </WordDropInput>,
    );
    expect(screen.getByText("falling word")).toBeInTheDocument();
  });
});
