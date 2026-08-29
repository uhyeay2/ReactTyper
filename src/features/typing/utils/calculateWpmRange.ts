import type { WpmTimelinePoint } from "../metrics/wpm";

export interface WpmRange {
  highest: number;
  lowest: number;
}

/**
 * Returns the highest and lowest WPM values across the timeline.
 *
 * Zero-valued points are excluded because they only occur while the live
 * WPM window has not yet validated and are not meaningful speed readings.
 * Returns zeros for both fields when no positive points exist.
 */
export function calculateWpmRange(timeline: WpmTimelinePoint[]): WpmRange {
  const validPoints = timeline.filter((point) => point.wpm > 0);
  if (validPoints.length === 0) return { highest: 0, lowest: 0 };

  let highest = validPoints[0]!.wpm;
  let lowest = validPoints[0]!.wpm;

  for (const point of validPoints) {
    if (point.wpm > highest) highest = point.wpm;
    if (point.wpm < lowest) lowest = point.wpm;
  }

  return { highest, lowest };
}