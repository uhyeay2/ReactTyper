import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore, type EnhancedStore } from "@reduxjs/toolkit";
import rootReducer from "@/app/rootReducer";
import type { TypingState } from "../../state/typingTypes";
import { Finger } from "./keyboardLayout";
import { VirtualKeyboard } from "./VirtualKeyboard";
import styles from "./VirtualKeyboard.module.css";

const DEFAULT_TYPING: TypingState = {
  view: "test",
  status: "active",
  targetText: "",
  typedText: "",
  currentIndex: 0,
  errors: 0,
  correctChars: 0,
  totalTyped: 0,
  startTime: Date.now(),
  elapsedTime: 0,
  results: null,
  wordCount: 0,
  fixedChars: "",
  pausedElapsed: 0,
  wpmHistory: [],
  keystrokes: [],
  liveWpm: 0,
  wpmTimeline: [],
  sessionContext: {
    sessionType: 0,
    lessonSlug: null,
    lessonUnitOrder: null,
    wordBankSlug: null,
  },
};

function createStore(partial: Partial<TypingState>): EnhancedStore {
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      typing: { ...DEFAULT_TYPING, ...partial },
    } as never,
  });
}

function renderKeyboard(targetText: string, currentIndex: number) {
  return render(
    <Provider store={createStore({ targetText, currentIndex })}>
      <VirtualKeyboard />
    </Provider>,
  );
}

function activeKeyLabels(): string[] {
  return Array.from(document.querySelectorAll(`.${styles.keyActive}`)).map(
    (el) => el.textContent ?? "",
  );
}

function activeShiftKeyLabels(): string[] {
  return Array.from(
    document.querySelectorAll(`.${styles.keyShiftActive}`),
  ).map((el) => el.textContent ?? "");
}

function guidanceLabel(): string | null {
  const label = document.querySelector(`.${styles.srOnly}`);
  return label?.textContent ?? null;
}

function handFor(hand: "left" | "right"): SVGSVGElement {
  const handEl = document.querySelector(
    `svg[data-testid="${hand}-hand"]`,
  ) as SVGSVGElement | null;
  if (handEl === null) throw new Error(`Missing ${hand}-hand`);
  return handEl;
}

function fingerTransform(
  finger: Finger,
  hand: "left" | "right",
): string | null {
  const rect = handFor(hand).querySelector(
    `rect[data-finger="${finger}"]`,
  );
  return rect?.closest("g")?.getAttribute("transform") ?? null;
}

function fingerActive(finger: Finger, hand: "left" | "right"): boolean {
  const rect = handFor(hand).querySelector(`rect[data-finger="${finger}"]`);
  return rect?.getAttribute("class")?.includes("fingerActive") ?? false;
}

describe("VirtualKeyboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the main keyboard rows", () => {
    renderKeyboard("go", 0);
    expect(screen.getAllByText("Q").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Space").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Shift").length).toBeGreaterThan(0);
  });

  it("highlights the next key for a lowercase letter", () => {
    renderKeyboard("go", 0);
    expect(activeKeyLabels()).toEqual(["G"]);
    expect(activeShiftKeyLabels()).toHaveLength(0);
  });

  it("highlights only the shift key and the letter key for uppercase", () => {
    renderKeyboard("Go", 0);
    expect(activeKeyLabels()).toEqual(["G"]);
    expect(activeShiftKeyLabels().length).toBeGreaterThan(0);
  });

  it("shows both hands at all times", () => {
    renderKeyboard("go", 0);
    expect(screen.getByTestId("left-hand")).toBeInTheDocument();
    expect(screen.getByTestId("right-hand")).toBeInTheDocument();
  });

  it("shows both hands even when no guidance is available", () => {
    renderKeyboard("ab", 2);
    expect(screen.getByTestId("left-hand")).toBeInTheDocument();
    expect(screen.getByTestId("right-hand")).toBeInTheDocument();
  });

  it("moves only the left index finger toward the G key", () => {
    renderKeyboard("go", 0);
    // 'g' sits one home-row key to the right of 'f', so the index moves by one
    // key pitch (20 view-box units).
    expect(fingerTransform(Finger.LeftIndex, "left")).toContain(
      "translate(20, 0)",
    );
    expect(fingerTransform(Finger.LeftPinky, "left")).toBe("translate(0, 0)");
    expect(fingerTransform(Finger.RightIndex, "right")).toBe("translate(0, 0)");
  });

  it("moves only the right index finger toward the Y key", () => {
    renderKeyboard("y", 0);
    expect(fingerTransform(Finger.RightIndex, "right")).not.toBe(
      "translate(0, 0)",
    );
    expect(fingerTransform(Finger.RightMiddle, "right")).toBe(
      "translate(0, 0)",
    );
    expect(fingerTransform(Finger.LeftIndex, "left")).toBe("translate(0, 0)");
  });

  it("moves both the letter finger and the shift pinky for an uppercase letter", () => {
    renderKeyboard("I", 0);
    // 'I' = right middle moves to the key, left pinky moves to left Shift.
    expect(fingerTransform(Finger.RightMiddle, "right")).not.toBe(
      "translate(0, 0)",
    );
    expect(fingerTransform(Finger.LeftPinky, "left")).not.toBe(
      "translate(0, 0)",
    );
  });

  it("keeps the right thumb at rest over the spacebar for a space", () => {
    renderKeyboard("a ", 1);
    expect(fingerTransform(Finger.RightThumb, "right")).toBe("translate(0, 0)");
    expect(fingerActive(Finger.RightThumb, "right")).toBeTruthy();
  });

  it("keeps home-row keys' finger at rest while glowing", () => {
    // 'a' is on the home row, so the finger should not translate.
    renderKeyboard("ab", 0);
    expect(fingerTransform(Finger.LeftPinky, "left")).toBe("translate(0, 0)");
    expect(
      fingerActive(Finger.LeftPinky, "left"),
    ).toBeTruthy();
  });

  it("highlights the spacebar for a space character", () => {
    renderKeyboard("a ", 1);
    expect(activeKeyLabels()).toEqual(["Space"]);
  });

  it("provides a descriptive label for the current guidance", () => {
    renderKeyboard("go", 0);
    expect(guidanceLabel()).toMatch(/press g with left index/i);
  });
});
