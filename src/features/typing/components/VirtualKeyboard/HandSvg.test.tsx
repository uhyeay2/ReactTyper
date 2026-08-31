import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HandSvg } from "./HandSvg";
import { Finger } from "./keyboardLayout";
import styles from "./VirtualKeyboard.module.css";

function classOf(name: string | undefined): string {
  if (name === undefined) throw new Error("Missing CSS module class");
  return name;
}

const ACTIVE_CLASS = classOf(styles.fingerActive);
const getActiveRects = (container: HTMLElement) =>
  container.querySelectorAll(`rect.${ACTIVE_CLASS}`);

interface HandRender {
  hand: "left" | "right";
  activeFingers?: Finger[];
  fingerOffsets?: Partial<
    Record<Finger, { dx: number; dy: number }>
  >;
}

function renderHand({ hand, activeFingers = [], fingerOffsets = {} }: HandRender) {
  return render(
    <HandSvg hand={hand} activeFingers={activeFingers} fingerOffsets={fingerOffsets} />,
  );
}

describe("HandSvg", () => {
  it("renders the left hand", () => {
    renderHand({ hand: "left", activeFingers: [Finger.LeftIndex] });
    expect(screen.getByTestId("left-hand")).toBeInTheDocument();
  });

  it("renders the right hand", () => {
    renderHand({ hand: "right", activeFingers: [Finger.RightIndex] });
    expect(screen.getByTestId("right-hand")).toBeInTheDocument();
  });

  it("marks the active finger with the active class", () => {
    const { container } = renderHand({
      hand: "left",
      activeFingers: [Finger.LeftIndex],
    });
    const idxFinger = container.querySelector(
      `rect[data-finger="${Finger.LeftIndex}"]`,
    );
    expect(idxFinger).toHaveClass(ACTIVE_CLASS);
  });

  it("leaves inactive fingers without the active class", () => {
    const { container } = renderHand({
      hand: "left",
      activeFingers: [Finger.LeftIndex],
    });
    const pinky = container.querySelector(
      `rect[data-finger="${Finger.LeftPinky}"]`,
    );
    expect(pinky).not.toHaveClass(ACTIVE_CLASS);
  });

  it("activates the thumb when the thumb finger is active", () => {
    const { container } = renderHand({
      hand: "right",
      activeFingers: [Finger.RightThumb],
    });
    expect(getActiveRects(container).length).toBeGreaterThan(0);
  });

  it("puts the left thumb on the right (inside) of the left hand", () => {
    const { container } = renderHand({ hand: "left" });
    const thumbX = Number(
      container
        .querySelector(`rect[data-finger="${Finger.LeftThumb}"]`)
        ?.getAttribute("x") ?? NaN,
    );
    const indexX = Number(
      container
        .querySelector(`rect[data-finger="${Finger.LeftIndex}"]`)
        ?.getAttribute("x") ?? NaN,
    );
    expect(thumbX).toBeGreaterThan(indexX);
  });

  it("puts the right thumb on the left (inside) of the right hand", () => {
    const { container } = renderHand({ hand: "right" });
    const thumbX = Number(
      container
        .querySelector(`rect[data-finger="${Finger.RightThumb}"]`)
        ?.getAttribute("x") ?? NaN,
    );
    const indexX = Number(
      container
        .querySelector(`rect[data-finger="${Finger.RightIndex}"]`)
        ?.getAttribute("x") ?? NaN,
    );
    expect(thumbX).toBeLessThan(indexX);
  });

  it("applies a translate transform to a finger with an offset", () => {
    const { container } = renderHand({
      hand: "left",
      activeFingers: [Finger.LeftIndex],
      fingerOffsets: { [Finger.LeftIndex]: { dx: 12, dy: 34 } },
    });
    const idxFinger = container.querySelector(
      `rect[data-finger="${Finger.LeftIndex}"]`,
    );
    expect(idxFinger?.closest("g")).toHaveAttribute(
      "transform",
      "translate(12, 34)",
    );
  });

  it("leaves a finger without an offset at rest", () => {
    const { container } = renderHand({
      hand: "left",
      activeFingers: [Finger.LeftIndex],
    });
    const pinky = container.querySelector(
      `rect[data-finger="${Finger.LeftPinky}"]`,
    );
    expect(pinky?.closest("g")).toHaveAttribute("transform", "translate(0, 0)");
  });

  it("places the fingertips above the palm so the hand rests on its fingers", () => {
    const { container } = renderHand({ hand: "left" });
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    const palm = Array.from(svg?.querySelectorAll("rect") ?? []).find(
      (r) => r.getAttribute("data-finger") === null,
    );
    const palmY = Number(palm?.getAttribute("y") ?? Infinity);
    const indexTipY = Number(
      svg
        ?.querySelector(`rect[data-finger="${Finger.LeftIndex}"]`)
        ?.getAttribute("y") ?? Infinity,
    );
    // The finger tip must sit well above the palm within the hand's coordinate space.
    expect(indexTipY).toBeLessThan(palmY);
  });
});
