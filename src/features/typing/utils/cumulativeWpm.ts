import type { WpmSnapshot } from "../state/typingTypes";

export const CHARS_PER_WORD = 5;

export interface WpmPoint {
  second: number;
  wpm: number;
}

/**
 * Converts per-second cumulative typing snapshots into cumulative gross WPM
 * points.
 *
 * Each point at second `t` is the total characters typed since the start of
 * the test divided by the elapsed time, normalized to WPM:
 *
 *   wpm = totalTyped / CHARS_PER_WORD / (t / 60)
 *
 * The same pure, simple calculation is used for both the live readout and the
 * post-test graph so they always agree. Snapshots are cumulative, so points
 * represent the average speed over the whole test up to that second rather
 * than a rolling window. Points only reflect whole elapsed seconds (>= 1) to
 * avoid dividing by zero during the opening moment.
 */
export function computeCumulativeWpm(snapshots: WpmSnapshot[]): WpmPoint[] {
  const points: WpmPoint[] = [];

  for (const snapshot of snapshots) {
    const t = snapshot.second;
    if (t <= 0) continue;

    const minutes = t / 60;
    const wpm = Math.floor(snapshot.totalTyped / CHARS_PER_WORD / minutes);

    points.push({ second: t, wpm: Math.max(0, wpm) });
  }

  return points;
}
