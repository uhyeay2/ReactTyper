import { describe, it, expect } from "vitest";
import {
  computeCharStates,
  selectCurrentWpm,
  selectCurrentAccuracy,
  selectFinalErrors,
} from "../state/typingSelectors";
import { initialState } from "../state/typingSlice";
import type { TypingState } from "../state/typingTypes";

describe("computeCharStates", () => {
  it("classifies correct characters", () => {
    const states = computeCharStates("hello", "hello", 5, "");
    expect(states).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("classifies incorrect characters", () => {
    const states = computeCharStates("hello", "hbllo", 5, "");
    expect(states[1]).toBe("incorrect");
    expect(states[0]).toBe("correct");
  });

  it("classifies fixed characters", () => {
    const states = computeCharStates("hello", "hello", 5, "01000");
    expect(states[1]).toBe("fixed");
  });

  it("marks current and pending positions", () => {
    const states = computeCharStates("hello", "he", 2, "");
    expect(states[0]).toBe("correct");
    expect(states[1]).toBe("correct");
    expect(states[2]).toBe("current");
    expect(states[3]).toBe("pending");
    expect(states[4]).toBe("pending");
  });
});

describe("selectCurrentWpm", () => {
  const baseTyping: TypingState = {
    ...initialState,
    startTime: 1,
    totalTyped: 0,
    errors: 0,
    wpmHistory: [],
    elapsedTime: 0,
  };

  it("returns 0 when below minimum chars", () => {
    const state = {
      typing: { ...baseTyping, elapsedTime: 10, totalTyped: 4 },
    } as { typing: TypingState };
    expect(selectCurrentWpm(state)).toBe(0);
  });

  it("shows a WPM value during the first seconds", () => {
    const state = {
      typing: { ...baseTyping, elapsedTime: 1, totalTyped: 20, errors: 0 },
    } as { typing: TypingState };
    expect(selectCurrentWpm(state)).toBe(240);
  });

  it("shows the cumulative average during the opening seconds", () => {
    const state = {
      typing: {
        ...baseTyping,
        elapsedTime: 2,
        totalTyped: 30,
        errors: 0,
        wpmHistory: [{ second: 1, totalTyped: 20, errors: 0 }],
      },
    } as { typing: TypingState };
    expect(selectCurrentWpm(state)).toBe(180);
  });

  it("computes cumulative WPM for the full test", () => {
    const wpmHistory = Array.from({ length: 10 }, (_, i) => ({
      second: i + 1,
      totalTyped: (i + 1) * 5,
      errors: 0,
    }));
    const state = {
      typing: {
        ...baseTyping,
        elapsedTime: 10,
        totalTyped: 50,
        errors: 0,
        wpmHistory,
      },
    } as { typing: TypingState };
    expect(selectCurrentWpm(state)).toBe(60);
  });

  it("computes stable cumulative WPM for the full test", () => {
    const state = {
      typing: {
        ...baseTyping,
        elapsedTime: 15,
        totalTyped: 75,
        errors: 0,
        wpmHistory: Array.from({ length: 15 }, (_, i) => ({
          second: i + 1,
          totalTyped: (i + 1) * 5,
          errors: 0,
        })),
      },
    } as { typing: TypingState };
    expect(selectCurrentWpm(state)).toBe(60);
  });

  it("returns 0 when start time is not set", () => {
    const state = {
      typing: {
        ...baseTyping,
        startTime: null,
        elapsedTime: 10,
        totalTyped: 50,
      },
    } as { typing: TypingState };
    expect(selectCurrentWpm(state)).toBe(0);
  });

  it("returns 0 when elapsed time is zero", () => {
    const state = {
      typing: { ...baseTyping, elapsedTime: 0, totalTyped: 50 },
    } as { typing: TypingState };
    expect(selectCurrentWpm(state)).toBe(0);
  });
});

describe("selectCurrentAccuracy", () => {
  const baseTyping: TypingState = {
    ...initialState,
    totalTyped: 0,
    correctChars: 0,
  };

  it("returns 0 when nothing typed", () => {
    const state = { typing: baseTyping } as { typing: TypingState };
    expect(selectCurrentAccuracy(state)).toBe(0);
  });

  it("computes rounded accuracy percentage", () => {
    const state = {
      typing: { ...baseTyping, totalTyped: 4, correctChars: 3 },
    } as { typing: TypingState };
    expect(selectCurrentAccuracy(state)).toBe(75);
  });

  it("returns 100 for all correct", () => {
    const state = {
      typing: { ...baseTyping, totalTyped: 10, correctChars: 10 },
    } as { typing: TypingState };
    expect(selectCurrentAccuracy(state)).toBe(100);
  });
});

describe("selectFinalErrors", () => {
  const baseTyping: TypingState = {
    ...initialState,
    typedText: "",
    targetText: "",
  };

  it("returns 0 for no text", () => {
    const state = { typing: baseTyping } as { typing: TypingState };
    expect(selectFinalErrors(state)).toBe(0);
  });

  it("counts mismatched characters", () => {
    const state = {
      typing: { ...baseTyping, typedText: "hxllo", targetText: "hello" },
    } as { typing: TypingState };
    expect(selectFinalErrors(state)).toBe(1);
  });
});
