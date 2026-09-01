import { getRandomWords } from "@/features/typing/utils/wordList";

/**
 * Returns a new word drawn from the active typing word pool. The pool is the
 * default common-word list unless a word bank has been loaded via the typing
 * configuration, so Word Drop honors the selected Word Bank setting.
 */
export function getNextGameWord(): string {
  const words = getRandomWords(1);
  return words[0] ?? "the";
}
