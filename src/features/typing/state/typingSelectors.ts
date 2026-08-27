import { createSelector } from "@reduxjs/toolkit";
import type { TypingState } from "./typingTypes";
import { calculateGrossWpm, calculateNetWpm } from "../utils/calculateWpm";

const selectTyping = (state: { typing: TypingState }) => state.typing;

const MIN_CHARS_FOR_WPM = 5;

export const selectCurrentWpm = createSelector(
  [selectTyping],
  (typing) => {
    if (!typing.startTime || typing.elapsedTime <= 0) return 0;
    if (typing.totalTyped < MIN_CHARS_FOR_WPM) return 0;
    const elapsedMinutes = typing.elapsedTime / 60;
    const gross = calculateGrossWpm(typing.totalTyped, elapsedMinutes);
    return calculateNetWpm(gross, typing.errors, elapsedMinutes);
  },
);

export const selectCurrentAccuracy = createSelector(
  [selectTyping],
  (typing) => {
    if (typing.totalTyped <= 0) return 0;
    return Math.round((typing.correctChars / typing.totalTyped) * 100);
  },
);

export const selectFinalErrors = createSelector(
  [selectTyping],
  (typing) => {
    let errors = 0;
    for (
      let i = 0;
      i < typing.typedText.length && i < typing.targetText.length;
      i++
    ) {
      if (typing.typedText[i] !== typing.targetText[i]) errors++;
    }
    return errors;
  },
);

export const selectCharStates = createSelector(
  [selectTyping],
  (typing) => {
    const chars = typing.targetText.split("");
    return chars.map((char, index) => {
      if (index < typing.currentIndex) {
        const typed = typing.typedText[index];
        if (typed !== char) return "incorrect";
        if (typing.fixedChars[index] === "1") return "fixed";
        return "correct";
      }
      if (index === typing.currentIndex) return "current";
      return "pending";
    });
  },
);
