/** Characters that constitute one "word" in standard WPM normalization. */
export const CHARS_PER_WORD = 5;

/** Rolling live WPM window duration in milliseconds. */
export const LIVE_WINDOW_MS = 3000;

/** Fallback rolling live WPM window size in keystrokes. */
export const LIVE_WINDOW_SIZE = 20;

/** Minimum characters required in the live window before a WPM is emitted. */
export const MIN_LIVE_CHARS = 10;

/** Minimum span (seconds) of active typing required for the live window. */
export const MIN_LIVE_WINDOW_SECONDS = 2;

/** EMA smoothing factor for the live WPM feed. */
export const LIVE_WPM_ALPHA = 0.2;

/** A single captured keystroke with a high-precision timestamp. */
export interface Keystroke {
  /** Monotonic high-precision timestamp (performance.now() domain). */
  timestamp: number;
  /** Index of the typed character within the target/typed text. */
  charIndex: number;
}

/**
 * A single point of the live WPM timeline, ready for charting. Each point
 * represents the WPM that was displayed during the corresponding second of the
 * test, plus the words attributed to that second.
 */
export interface WpmTimelinePoint {
  /** 1-based second of the test this point represents. */
  second: number;
  /** Rounded WPM displayed at that second. */
  wpm: number;
  /** Words whose completion falls within this second. */
  words: string[];
}

/** Character range occupied by a typed word in the full typed text. */
export interface WordRange {
  wordText: string;
  startCharIndex: number;
  endCharIndex: number;
}

/**
 * Per-word metric surfaced in the results. Each word carries the second it was
 * completed in and the WPM of that second, keeping words aligned with the live
 * graph timeline.
 */
export interface WordState {
  wordText: string;
  startCharIndex: number;
  endCharIndex: number;
  /** 1-based second the word completed in, relative to the first keystroke. */
  second: number;
  /** WPM of the graph point matching `second`. */
  wpm: number;
}

/**
 * Converts a character count and a duration into WPM, normalized to 5
 * characters per word.
 */
function toWpm(chars: number, durationMs: number): number {
  const minutes = durationMs / 1000 / 60;
  if (minutes <= 0 || chars <= 0) return 0;
  return chars / CHARS_PER_WORD / minutes;
}

/**
 * Builds the rolling live WPM window by scanning the keystroke log backwards
 * from the most recent keystroke.
 *
 * A keystroke stays in the window while it occurred within the rolling
 * duration (default 3s), or, as a fallback, while the window still needs keys
 * to reach the minimum sample size (default 20). Scanning stops once both
 * criteria are exhausted, keeping the cost bounded by the window contents
 * rather than the full session length.
 */
function selectLiveWindow(keystrokes: Keystroke[]): Keystroke[] {
  const lastTimestamp = keystrokes[keystrokes.length - 1]!.timestamp;
  const window: Keystroke[] = [];

  for (let i = keystrokes.length - 1; i >= 0; i--) {
    const keystroke = keystrokes[i]!;
    const age = lastTimestamp - keystroke.timestamp;
    const withinDuration = age <= LIVE_WINDOW_MS;
    const withinSize = window.length < LIVE_WINDOW_SIZE;
    if (!withinDuration && !withinSize) break;
    window.unshift(keystroke);
  }

  return window;
}

/**
 * Computes the smoothed live WPM from the session keystroke log.
 *
 * The rolling window must contain at least `MIN_LIVE_CHARS` characters that
 * span at least `MIN_LIVE_WINDOW_SECONDS` before a value is emitted; otherwise
 * the previous value (0 at test start) is preserved. The raw window WPM is
 * blended with the previous emission using an EMA (`LIVE_WPM_ALPHA`) so the
 * live readout never spikes on a single burst.
 *
 * Pure function: the same inputs always yield the same output.
 */
export function computeLiveWpm(
  keystrokes: Keystroke[],
  previousLiveWpm: number,
): number {
  if (keystrokes.length === 0) return 0;

  const window = selectLiveWindow(keystrokes);
  if (window.length < MIN_LIVE_CHARS) return previousLiveWpm;

  const firstTimestamp = window[0]!.timestamp;
  const lastTimestamp = window[window.length - 1]!.timestamp;
  const durationMs = lastTimestamp - firstTimestamp;
  const durationSeconds = durationMs / 1000;

  if (durationSeconds < MIN_LIVE_WINDOW_SECONDS) return previousLiveWpm;

  const rawWpm = toWpm(window.length, durationMs);
  return LIVE_WPM_ALPHA * rawWpm + (1 - LIVE_WPM_ALPHA) * previousLiveWpm;
}

/**
 * Splits the typed text into the ordered list of typed words, skipping empty
 * tokens produced by trailing spaces. Each range maps to the character span of
 * the word within the full typed text.
 */
function deriveWordRanges(typedText: string): WordRange[] {
  const tokens = typedText.split(" ");
  const ranges: WordRange[] = [];
  let charIndex = 0;

  for (const token of tokens) {
    if (token.length === 0) {
      charIndex += 1;
      continue;
    }
    ranges.push({
      wordText: token,
      startCharIndex: charIndex,
      endCharIndex: charIndex + token.length - 1,
    });
    charIndex += token.length + 1;
  }

  return ranges;
}

/**
 * Returns the timeline point whose second is closest to the given second. The
 * timeline is expected to hold one point per elapsed second; a second without
 * a matching point falls back to the nearest recorded point.
 */
function nearestTimelinePoint(
  timeline: WpmTimelinePoint[],
  second: number,
): WpmTimelinePoint {
  let nearest = timeline[0]!;
  let nearestDistance = Math.abs(timeline[0]!.second - second);

  for (const point of timeline) {
    const distance = Math.abs(point.second - second);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = point;
    }
  }

  return nearest;
}

/**
 * Attributes every typed word to a second of the live WPM timeline.
 *
 * A word belongs to the second in which it was completed, computed relative to
 * the first keystroke. Each resulting state carries the `wpm` of the timeline
 * point for that second, so the words and the graph always agree on the value
 * shown for any interval.
 *
 * Returns an empty list when there are no keystrokes or no timeline to align
 * against.
 */
export function buildWordStates(
  typedText: string,
  keystrokes: Keystroke[],
  timeline: WpmTimelinePoint[],
): WordState[] {
  if (keystrokes.length === 0 || timeline.length === 0) return [];

  const origin = keystrokes[0]!.timestamp;

  return deriveWordRanges(typedText).map((range) => {
    let completionTimestamp = origin;
    for (const keystroke of keystrokes) {
      if (keystroke.charIndex <= range.endCharIndex) {
        completionTimestamp = keystroke.timestamp;
      }
    }

    const relativeSecond =
      Math.floor((completionTimestamp - origin) / 1000) + 1;
    const point = nearestTimelinePoint(timeline, relativeSecond);

    return {
      wordText: range.wordText,
      startCharIndex: range.startCharIndex,
      endCharIndex: range.endCharIndex,
      second: point.second,
      wpm: point.wpm,
    };
  });
}

/**
 * Populates each timeline point with the words that were completed during its
 * second. Returns a new timeline array; the input is not mutated.
 */
export function attachWordsToTimeline(
  timeline: WpmTimelinePoint[],
  wordStates: WordState[],
): WpmTimelinePoint[] {
  const wordsBySecond = new Map<number, string[]>();

  for (const state of wordStates) {
    const bucket = wordsBySecond.get(state.second) ?? [];
    bucket.push(state.wordText);
    wordsBySecond.set(state.second, bucket);
  }

  return timeline.map((point) => ({
    ...point,
    words: wordsBySecond.get(point.second) ?? [],
  }));
}
