import { createSelector } from "@reduxjs/toolkit";
import type { TypingState, CharState } from "./typingTypes";
import { computeCumulativeWpm } from "../utils/cumulativeWpm";

const selectTyping = (state: { typing: TypingState }) => state.typing;

const MIN_CHARS_FOR_WPM = 5;

export const selectCurrentWpm = createSelector([selectTyping], (typing) => {
  if (!typing.startTime || typing.elapsedTime <= 0) return 0;
  if (typing.totalTyped < MIN_CHARS_FOR_WPM) return 0;
  const snapshots = [
    ...typing.wpmHistory,
    {
      second: typing.elapsedTime,
      totalTyped: typing.totalTyped,
      errors: typing.errors,
    },
  ];
  const points = computeCumulativeWpm(snapshots);
  const lastPoint = points[points.length - 1];
  return lastPoint ? lastPoint.wpm : 0;
});

export const selectCurrentAccuracy = createSelector(
  [selectTyping],
  (typing) => {
    if (typing.totalTyped <= 0) return 0;
    return Math.round((typing.correctChars / typing.totalTyped) * 100);
  },
);

export const selectFinalErrors = createSelector([selectTyping], (typing) => {
  let errors = 0;
  for (
    let i = 0;
    i < typing.typedText.length && i < typing.targetText.length;
    i++
  ) {
    if (typing.typedText[i] !== typing.targetText[i]) errors++;
  }
  return errors;
});

export const computeCharStates = (
  targetText: string,
  typedText: string,
  currentIndex: number,
  fixedChars: string,
): CharState[] => {
  const chars = targetText.split("");
  return chars.map((char, index) => {
    if (index < currentIndex) {
      const typed = typedText[index];
      if (typed !== char) return "incorrect";
      if (fixedChars[index] === "1") return "fixed";
      return "correct";
    }
    if (index === currentIndex) return "current";
    return "pending";
  });
};

export const selectCharStates = createSelector([selectTyping], (typing) =>
  computeCharStates(
    typing.targetText,
    typing.typedText,
    typing.currentIndex,
    typing.fixedChars,
  ),
);
