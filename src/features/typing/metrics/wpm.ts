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

/** Post-test timeline bucket duration in milliseconds. */
export const TIMELINE_BUCKET_MS = 1000;

/** Minimum characters a timeline bucket needs to be considered meaningful. */
export const MIN_TIMELINE_CHARS = 5;

/** EMA smoothing factor applied across post-test timeline buckets. */
export const TIMELINE_ALPHA = 0.2;

/** Words shorter than this duration (ms) yield no per-word WPM. */
export const WORD_MIN_DURATION_MS = 1000;

/** Inter-keystroke gap (ms) inside a word that counts as a mid-word pause. */
export const WORD_PAUSE_THRESHOLD_MS = 1500;

/** EMA smoothing factor applied across adjacent per-word values. */
export const WORD_WPM_ALPHA = 0.25;

/** A single captured keystroke with a high-precision timestamp. */
export interface Keystroke {
  /** Monotonic high-precision timestamp (performance.now() domain). */
  timestamp: number;
  /** Index of the typed character within the target/typed text. */
  charIndex: number;
}

/** A single point of the post-test WPM timeline, ready for charting. */
export interface WpmTimelinePoint {
  second: number;
  wpm: number;
}

/** Character range occupied by a typed word in the full typed text. */
export interface WordRange {
  wordText: string;
  startCharIndex: number;
  endCharIndex: number;
}

/** Per-word metric surfaced in the results screen. */
export interface WordState {
  wordText: string;
  startCharIndex: number;
  endCharIndex: number;
  wordWpm: number | null;
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
 * Splits keystrokes into one-second buckets and derives a smoothed WPM
 * timeline for the results graph.
 *
 * Only the first keystroke is used as the timeline origin, so buckets are
 * relative to typing activity rather than wall-clock start. Buckets with fewer
 * than `MIN_TIMELINE_CHARS` characters are ignored, and the EMA state is
 * preserved across ignored buckets. Points are labeled with a 1-based second.
 */
export function computeWpmTimeline(
  keystrokes: Keystroke[],
): WpmTimelinePoint[] {
  if (keystrokes.length === 0) return [];

  const firstTimestamp = keystrokes[0]!.timestamp;
  const bucketCounts: number[] = [];

  for (const keystroke of keystrokes) {
    const bucketIndex = Math.floor(
      (keystroke.timestamp - firstTimestamp) / TIMELINE_BUCKET_MS,
    );
    bucketCounts[bucketIndex] = (bucketCounts[bucketIndex] ?? 0) + 1;
  }

  let ema: number | null = null;
  const points: WpmTimelinePoint[] = [];

  for (let index = 0; index < bucketCounts.length; index++) {
    const count = bucketCounts[index] ?? 0;
    if (count < MIN_TIMELINE_CHARS) continue;

    const rawWpm = toWpm(count, TIMELINE_BUCKET_MS);
    ema =
      ema === null
        ? rawWpm
        : TIMELINE_ALPHA * rawWpm + (1 - TIMELINE_ALPHA) * ema;

    points.push({ second: index + 1, wpm: Math.round(ema) });
  }

  return points;
}

/**
 * Computes the effective "active" duration of a word by subtracting every
 * mid-word pause longer than `WORD_PAUSE_THRESHOLD_MS`. A word split by a
 * pause therefore reports the WPM of its active segments.
 */
function activeWordDuration(keystrokes: Keystroke[]): number {
  const firstTimestamp = keystrokes[0]!.timestamp;
  const lastTimestamp = keystrokes[keystrokes.length - 1]!.timestamp;
  let activeDuration = lastTimestamp - firstTimestamp;

  for (let i = 1; i < keystrokes.length; i++) {
    const gap = keystrokes[i]!.timestamp - keystrokes[i - 1]!.timestamp;
    if (gap > WORD_PAUSE_THRESHOLD_MS) {
      activeDuration -= gap;
    }
  }

  return Math.max(0, activeDuration);
}

/**
 * Computes per-word WPM values aligned with the given word ranges.
 *
 * Raw WPM is only computed when the word's full duration is at least
 * `WORD_MIN_DURATION_MS`; short or single-character words resolve to null.
 * Mid-word pauses longer than `WORD_PAUSE_THRESHOLD_MS` are removed so the
 * word reflects its active segments. The final displayed value is then EMA
 * smoothed across adjacent words (`WORD_WPM_ALPHA`); null words do not
 * participate in smoothing and remain null.
 */
export function computeWordWpms(
  ranges: WordRange[],
  keystrokes: Keystroke[],
): (number | null)[] {
  let previousSmoothed: number | null = null;

  return ranges.map((range) => {
    const wordKeystrokes = keystrokes.filter(
      (keystroke) =>
        keystroke.charIndex >= range.startCharIndex &&
        keystroke.charIndex <= range.endCharIndex,
    );
    if (wordKeystrokes.length < 2) return null;

    const firstTimestamp = wordKeystrokes[0]!.timestamp;
    const lastTimestamp = wordKeystrokes[wordKeystrokes.length - 1]!.timestamp;
    if (lastTimestamp - firstTimestamp < WORD_MIN_DURATION_MS) return null;

    const activeDuration = activeWordDuration(wordKeystrokes);
    if (activeDuration <= 0) return null;

    const rawWpm = toWpm(
      range.endCharIndex - range.startCharIndex + 1,
      activeDuration,
    );
    previousSmoothed =
      previousSmoothed === null
        ? rawWpm
        : WORD_WPM_ALPHA * rawWpm + (1 - WORD_WPM_ALPHA) * previousSmoothed;

    return Math.round(previousSmoothed);
  });
}

/**
 * Derives the ordered list of typed words (skipping empty tokens produced by
 * trailing spaces) and computes their per-word WPM from the keystroke log.
 */
export function buildWordStates(
  typedText: string,
  keystrokes: Keystroke[],
): WordState[] {
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

  const wordWpms = computeWordWpms(ranges, keystrokes);

  return ranges.map((range, index) => ({
    wordText: range.wordText,
    startCharIndex: range.startCharIndex,
    endCharIndex: range.endCharIndex,
    wordWpm: wordWpms[index] ?? null,
  }));
}
