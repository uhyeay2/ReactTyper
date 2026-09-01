import type { WordDropWordQuality } from "../state/gamesTypes";

/** Base score awarded for completing a word without any correction. */
export const SCORE_PERFECT_WORD = 100;
/** Score awarded for completing a word after correcting a typo. */
export const SCORE_CORRECTED_WORD = 50;
/** Score awarded for completing a word that still contains an error. */
export const SCORE_ERRORED_WORD = 10;
/** Bonus multiplier weight applied per WPM when scoring a word. */
export const SPEED_BONUS_SCALE = 0.5;
/** Maximum speed bonus that can be earned for a single word. */
export const MAX_SPEED_BONUS = 25;

export interface ScoreBreakdown {
  points: number;
  speedBonus: number;
  total: number;
}

/**
 * Classifies a completed word by how it was typed:
 * - "perfect" when it was typed with no errors or corrections,
 * - "corrected" when at least one correction was made but the word is correct,
 * - "errored" when the word still contains an incorrect character.
 */
export function classifyWordQuality(
  hasError: boolean,
  wasCorrected: boolean,
): WordDropWordQuality {
  if (hasError) return "errored";
  if (wasCorrected) return "corrected";
  return "perfect";
}

/**
 * Computes the score earned for completing a single word. The base value is
 * derived from how the word was typed (perfect > corrected > errored) and is
 * augmented by a bounded speed bonus proportional to the user's typing speed
 * in WPM at completion time. Pure and deterministic.
 */
export function computeWordScore(
  quality: WordDropWordQuality,
  wpmAtCompletion: number,
): ScoreBreakdown {
  const base =
    quality === "perfect"
      ? SCORE_PERFECT_WORD
      : quality === "corrected"
        ? SCORE_CORRECTED_WORD
        : SCORE_ERRORED_WORD;

  const speedBonus = Math.round(
    Math.min(MAX_SPEED_BONUS, Math.max(0, wpmAtCompletion) * SPEED_BONUS_SCALE),
  );

  return {
    points: base,
    speedBonus,
    total: base + speedBonus,
  };
}

/**
 * Accuracy percentage (0-100) of a completed word computed from its per-char
 * correct and incorrect totals. When nothing was typed, accuracy is 100.
 */
export function computeAccuracy(
  correctCharacters: number,
  incorrectCharacters: number,
): number {
  const total = correctCharacters + incorrectCharacters;
  if (total === 0) return 100;
  return Math.round((correctCharacters / total) * 100);
}
