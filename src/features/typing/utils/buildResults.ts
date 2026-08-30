import type { Keystroke, WpmTimelinePoint } from "../metrics/wpm";
import {
  attachWordsToTimeline,
  backfillInitialWpm,
  buildWordStates,
} from "../metrics/wpm";
import { calculateAccuracy } from "./calculateAccuracy";
import { calculateGrossWpm, calculateNetWpm } from "./calculateWpm";
import { calculateAverageWpm } from "./calculateAverageWpm";
import { calculateWpmRange } from "./calculateWpmRange";
import { calculateWordStats } from "./calculateWordStats";
import type { TypingResults } from "../state/typingTypes";
import { computeCharStates } from "../state/typingSelectors";

export interface BuildResultsInput {
  typedText: string;
  targetText: string;
  totalTyped: number;
  correctChars: number;
  elapsedTime: number;
  fixedChars: string;
  keystrokes: Keystroke[];
  recordedTimeline: WpmTimelinePoint[];
}

export interface BuildResultsOutput {
  results: TypingResults;
  wpmTimeline: WpmTimelinePoint[];
}

/**
 * Builds the complete results and final WPM timeline for a finished test.
 *
 * Shared by the normal completion and early-quit paths so both produce
 * identical metrics. When no time has elapsed, WPM values fall back to 0
 * rather than assuming a full minute baseline.
 */
export function buildResults({
  typedText,
  targetText,
  totalTyped,
  correctChars,
  elapsedTime,
  fixedChars,
  keystrokes,
  recordedTimeline,
}: BuildResultsInput): BuildResultsOutput {
  const characterErrors = countCharacterErrors(typedText, targetText);

  const elapsedMinutes = elapsedTime > 0 ? elapsedTime / 60 : 0;
  const gross = calculateGrossWpm(totalTyped, elapsedMinutes);
  const net = calculateNetWpm(gross, characterErrors, elapsedMinutes);
  const accuracy = calculateAccuracy(correctChars, totalTyped);

  const wordStats = calculateWordStats(targetText, typedText, fixedChars);

  const normalizedTimeline = backfillInitialWpm(recordedTimeline);
  const wordStates = buildWordStates(typedText, keystrokes, normalizedTimeline);
  const wpmTimeline = attachWordsToTimeline(normalizedTimeline, wordStates);
  const wpmRange = calculateWpmRange(wpmTimeline);
  const charStates = computeCharStates(
    targetText,
    typedText,
    typedText.length,
    fixedChars,
  );

  return {
    results: {
      wpm: net,
      grossWpm: gross,
      accuracy,
      correctChars,
      incorrectChars:
        wordStats.wordsTypedWithErrors + wordStats.wordsTypedWithCorrections,
      elapsedTime,
      totalWordsTyped: wordStats.totalWordsTyped,
      wordsTypedWithErrors: wordStats.wordsTypedWithErrors,
      wordsTypedWithCorrections: wordStats.wordsTypedWithCorrections,
      wordsTypedPerfectly: wordStats.wordsTypedPerfectly,
      highestWpm: wpmRange.highest,
      lowestWpm: wpmRange.lowest,
      averageWpm: calculateAverageWpm(wpmTimeline),
      wordStates,
      charStates,
    },
    wpmTimeline,
  };
}

function countCharacterErrors(typedText: string, targetText: string): number {
  let errors = 0;
  for (let i = 0; i < typedText.length && i < targetText.length; i++) {
    if (typedText[i] !== targetText[i]) errors += 1;
  }
  return errors;
}