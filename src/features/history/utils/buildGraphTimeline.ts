import type { WpmGraphPoint } from "@/shared/components/WpmGraph/WpmGraph";
import type { TypingTestResult } from "../state/historyTypes";

/**
 * Maps a persisted typing result's timeline into points consumable by the
 * shared WpmGraph. Words are reconstructed by grouping the result's typed
 * words by the second they completed in, so the history graph's tooltip shows
 * the words typed during each second exactly like the live results graph.
 */
export function buildGraphTimeline(result: TypingTestResult): WpmGraphPoint[] {
  const wordsBySecond = new Map<number, string[]>();

  for (const word of result.typedWords) {
    const bucket = wordsBySecond.get(word.second) ?? [];
    bucket.push(word.wordText);
    wordsBySecond.set(word.second, bucket);
  }

  return result.wpmTimeline.map((point) => ({
    second: point.second,
    wpm: point.wpm,
    words: wordsBySecond.get(point.second) ?? [],
  }));
}