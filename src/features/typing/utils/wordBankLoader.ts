import { apiGetWordBank } from "@/features/typingConfig/services/wordBanksApi";
import { logger } from "@/infrastructure/logging/logger";
import { setActiveWordPool } from "./wordList";

const wordCache = new Map<string, string[]>();

/**
 * Loads the words for a word bank by slug and applies them as the active
 * typing word pool. Results are cached keyed by slug so repeated selections
 * do not re-fetch. Returns false when the bank cannot be loaded; in that case
 * the current pool is left unchanged.
 */
export async function loadWordBankWords(slug: string): Promise<boolean> {
  const cached = wordCache.get(slug);
  if (cached !== undefined) {
    setActiveWordPool(cached);
    return true;
  }

  try {
    const bank = await apiGetWordBank(slug);
    const words = bank.words;
    wordCache.set(slug, words);
    setActiveWordPool(words);
    return true;
  } catch {
    logger.warn("Failed to load word bank", { slug });
    return false;
  }
}

/** Clears the word bank cache. Intended for tests. */
export function clearWordBankCache(): void {
  wordCache.clear();
}
