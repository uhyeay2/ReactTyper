import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KEYBOARD_ROWS } from "./keyboardLayout";
import { KeyboardRow } from "./KeyboardRow";
import styles from "./VirtualKeyboard.module.css";

function classOf(name: string | undefined): string {
  if (name === undefined) throw new Error("Missing CSS module class");
  return name;
}

describe("KeyboardRow", () => {
  it("renders a key for each key in the row", () => {
    const row = KEYBOARD_ROWS[1];
    if (row === undefined) throw new Error("Missing row");
    render(
      <KeyboardRow
        keys={row}
        activeKey={null}
        activeShiftKey={false}
      />,
    );
    row.forEach((k) => {
      expect(screen.getByText(k.label)).toBeInTheDocument();
    });
  });

  it("highlights the active key", () => {
    const row = KEYBOARD_ROWS[2];
    if (row === undefined) throw new Error("Missing row");
    const { container } = render(
      <KeyboardRow
        keys={row}
        activeKey="g"
        activeShiftKey={false}
      />,
    );
    const activeKeys = container.querySelectorAll(`.${classOf(styles.keyActive)}`);
    expect(activeKeys).toHaveLength(1);
    expect(activeKeys[0]).toHaveTextContent("G");
  });

  it("highlights the shift key when activeShiftKey is true", () => {
    const row = KEYBOARD_ROWS[3];
    if (row === undefined) throw new Error("Missing row");
    const { container } = render(
      <KeyboardRow
        keys={row}
        activeKey={null}
        activeShiftKey={true}
      />,
    );
    const activeShifts = container.querySelectorAll(
      `.${classOf(styles.keyShiftActive)}`,
    );
    expect(activeShifts.length).toBeGreaterThan(0);
  });
});
