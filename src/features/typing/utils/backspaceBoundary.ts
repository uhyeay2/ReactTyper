/**
 * Computes the lowest character index that backspace is allowed to reach,
 * given the currently typed text.
 *
 * The caret always sits at the end of `typedText`. Users may backspace over
 * the word they are currently typing plus the immediately preceding word, but
 * never further. The boundary is therefore the position immediately after the
 * word before those two, which keeps "the current word and the previous word
 * at most" deletable.
 *
 * For example, typing `word1 word2 word3 wor` yields a boundary of `11`
 * (the end of `word2`), so backspace can only reach `word1 word2`.
 */
export function computeBackspaceBoundary(typedText: string): number {
  const tokens = typedText.split(" ");
  if (tokens.length <= 2) return 0;
  return tokens.slice(0, tokens.length - 2).join(" ").length;
}