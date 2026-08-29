import type { WpmTimelinePoint } from "../metrics/wpm";

/**
 * Returns the arithmetic mean of the positive timeline WPM values, rounded to
 * the nearest whole number.
 *
 * Zero-valued points are excluded because they only occur while the live WPM
 * window has not yet validated and are not meaningful speed readings. This
 * keeps the average consistent with `calculateWpmRange`, which measures the
 * same positive points. Returns 0 when no positive points exist.
 */
export function calculateAverageWpm(timeline: WpmTimelinePoint[]): number {
  const validPoints = timeline.filter((point) => point.wpm > 0);
  if (validPoints.length === 0) return 0;

  const sum = validPoints.reduce((total, point) => total + point.wpm, 0);
  return Math.round(sum / validPoints.length);
}