import { deriveWordRanges } from "../metrics/wpm";

/** Aggregated per-word quality metrics for a completed test. */
export interface WordStats {
  totalWordsTyped: number;
  /** Words still containing at least one mismatched character at the end. */
  wordsTypedWithErrors: number;
  /** Words that contain at least one corrected character and no remaining errors. */
  wordsTypedWithCorrections: number;
  /** Words with no errors and no corrections. */
  wordsTypedPerfectly: number;
}

/**
 * Counts the number of target words that contained an error at any point,
 * whether it was corrected before completion or not.
 */
export function countWordsWithErrors(
  targetText: string,
  typedText: string,
  fixedChars: string,
): number {
  const targetWords = targetText.split(" ");
  let charIndex = 0;
  let wordErrorCount = 0;

  for (const word of targetWords) {
    let hasError = false;
    for (let i = 0; i < word.length; i++) {
      const targetIndex = charIndex + i;
      if (targetIndex < typedText.length && targetIndex < targetText.length) {
        if (typedText[targetIndex] !== targetText[targetIndex]) {
          hasError = true;
          break;
        }
        if (
          fixedChars.length > targetIndex &&
          fixedChars[targetIndex] === "1"
        ) {
          hasError = true;
          break;
        }
      }
    }
    if (hasError) wordErrorCount += 1;
    charIndex += word.length + 1;
  }

  return wordErrorCount;
}

/**
 * Categorizes every typed word as error-free, corrected, or still wrong.
 *
 * The three categories are mutually exclusive and together equal
 * `totalWordsTyped`: a word that was corrected but still contains a remaining
 * error is counted as an error word.
 */
export function calculateWordStats(
  targetText: string,
  typedText: string,
  fixedChars: string,
): WordStats {
  const ranges = deriveWordRanges(typedText);
  let wordsTypedWithErrors = 0;
  let wordsTypedWithCorrections = 0;
  let wordsTypedPerfectly = 0;

  for (const range of ranges) {
    let hasRemainingError = false;
    let hasCorrection = false;

    for (let i = range.startCharIndex; i <= range.endCharIndex; i++) {
      if (i >= targetText.length) break;
      if (typedText[i] !== targetText[i]) {
        hasRemainingError = true;
      }
      if (i < fixedChars.length && fixedChars[i] === "1") {
        hasCorrection = true;
      }
    }

    if (hasRemainingError) {
      wordsTypedWithErrors += 1;
    } else if (hasCorrection) {
      wordsTypedWithCorrections += 1;
    } else {
      wordsTypedPerfectly += 1;
    }
  }

  return {
    totalWordsTyped: ranges.length,
    wordsTypedWithErrors,
    wordsTypedWithCorrections,
    wordsTypedPerfectly,
  };
}