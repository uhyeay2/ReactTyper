import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyboardKey } from "./KeyboardKey";
import styles from "./VirtualKeyboard.module.css";

function classOf(name: string | undefined): string {
  if (name === undefined) throw new Error("Missing CSS module class");
  return name;
}

describe("KeyboardKey", () => {
  it("renders the label", () => {
    render(
      <KeyboardKey
        label="G"
        width={1}
        isActive={false}
        isShiftActive={false}
        isSpecial={false}
      />,
    );
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("applies the active class when active", () => {
    const { container } = render(
      <KeyboardKey
        label="A"
        width={1}
        isActive={true}
        isShiftActive={false}
        isSpecial={false}
      />,
    );
    const key = container.firstElementChild;
    expect(key).toHaveClass(classOf(styles.keyActive));
  });

  it("does not apply the active class when not active", () => {
    const { container } = render(
      <KeyboardKey
        label="A"
        width={1}
        isActive={false}
        isShiftActive={false}
        isSpecial={false}
      />,
    );
    const key = container.firstElementChild;
    expect(key).not.toHaveClass(classOf(styles.keyActive));
  });

  it("applies the shift active class when shift is active", () => {
    const { container } = render(
      <KeyboardKey
        label="A"
        width={1}
        isActive={false}
        isShiftActive={true}
        isSpecial={false}
      />,
    );
    const key = container.firstElementChild;
    expect(key).toHaveClass(classOf(styles.keyShiftActive));
  });

  it("applies the special class for special keys", () => {
    const { container } = render(
      <KeyboardKey
        label="Tab"
        width={1.5}
        isActive={false}
        isShiftActive={false}
        isSpecial={true}
      />,
    );
    const key = container.firstElementChild;
    expect(key).toHaveClass(classOf(styles.keySpecial));
  });

  it("is hidden from assistive technology as a decorative key", () => {
    render(
      <KeyboardKey
        label="A"
        width={1}
        isActive={false}
        isShiftActive={false}
        isSpecial={false}
      />,
    );
    expect(screen.getByText("A")).toHaveAttribute("aria-hidden", "true");
  });
});
