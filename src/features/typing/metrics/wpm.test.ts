import { describe, it, expect } from "vitest";
import {
  CHARS_PER_WORD,
  LIVE_WINDOW_MS,
  LIVE_WINDOW_SIZE,
  LIVE_WPM_ALPHA,
  MIN_LIVE_CHARS,
  MIN_LIVE_WINDOW_SECONDS,
  TIMELINE_ALPHA,
  TIMELINE_BUCKET_MS,
  WORD_MIN_DURATION_MS,
  WORD_PAUSE_THRESHOLD_MS,
  WORD_WPM_ALPHA,
  computeLiveWpm,
  computeWpmTimeline,
  computeWordWpms,
  buildWordStates,
  type Keystroke,
  type WordRange,
} from "./wpm";

function buildLog(charCountPerStep: number[], intervalMs: number): Keystroke[] {
  const keystrokes: Keystroke[] = [];
  let index = 0;
  let timestamp = 0;
  for (const step of charCountPerStep) {
    for (let i = 0; i < step; i++) {
      keystrokes.push({ timestamp: timestamp + i * 10, charIndex: index });
      index += 1;
    }
    timestamp += intervalMs;
  }
  return keystrokes;
}

function steadyLog(charsPerSecond: number, seconds: number): Keystroke[] {
  return buildLog(
    Array.from({ length: seconds }, () => charsPerSecond),
    1000,
  );
}

function expectedEma(previous: number, raw: number): number {
  return LIVE_WPM_ALPHA * raw + (1 - LIVE_WPM_ALPHA) * previous;
}

describe("constants", () => {
  it("exposes the standards required by the feature", () => {
    expect(CHARS_PER_WORD).toBe(5);
    expect(LIVE_WINDOW_MS).toBe(3000);
    expect(LIVE_WINDOW_SIZE).toBe(20);
    expect(MIN_LIVE_CHARS).toBe(10);
    expect(MIN_LIVE_WINDOW_SECONDS).toBe(2);
    expect(LIVE_WPM_ALPHA).toBe(0.2);
    expect(TIMELINE_BUCKET_MS).toBe(1000);
    expect(TIMELINE_ALPHA).toBe(0.2);
    expect(WORD_MIN_DURATION_MS).toBe(1000);
    expect(WORD_PAUSE_THRESHOLD_MS).toBe(1500);
    expect(WORD_WPM_ALPHA).toBe(0.25);
  });
});

describe("computeLiveWpm", () => {
  it("returns 0 for an empty log", () => {
    expect(computeLiveWpm([], 0)).toBe(0);
  });

  it("returns 0 before the minimum character count is reached", () => {
    const log = buildLog([9], 1000);
    expect(computeLiveWpm(log, 0)).toBe(0);
  });

  it("returns the previous value when the window has too few characters", () => {
    const log = buildLog([5], 1000);
    expect(computeLiveWpm(log, 42)).toBe(42);
  });

  it("returns the previous value when the window spans less than 2 seconds", () => {
    const log = buildLog([10], MIN_LIVE_WINDOW_SECONDS * 1000 - 100);
    expect(computeLiveWpm(log, 0)).toBe(0);
  });

  it("keeps the previous value while the window is too small even late in the test", () => {
    const log = buildLog([10, 0, 0], 1000);
    expect(computeLiveWpm(log, 31)).toBe(31);
  });

  it("computes an EMA-smoothed WPM for a steady ≥2s window", () => {
    const log = steadyLog(5, 3);
    const last = log[log.length - 1]!.timestamp;
    const first = log[0]!.timestamp;
    const raw = log.length / CHARS_PER_WORD / ((last - first) / 1000 / 60);
    expect(computeLiveWpm(log, 0)).toBeCloseTo(expectedEma(0, raw), 6);
  });

  it("never spikes: EMA blends the raw value with the previous emission", () => {
    const log = buildLog([12, 12, 12], 1000);
    const last = log[log.length - 1]!.timestamp;
    const window = log.filter((k) => last - k.timestamp <= LIVE_WINDOW_MS);
    const spanMs = last - window[0]!.timestamp;
    const raw = window.length / CHARS_PER_WORD / (spanMs / 1000 / 60);
    const first = expectedEma(0, raw);
    expect(computeLiveWpm(log, 0)).toBeCloseTo(first, 6);
    expect(first).toBeLessThan(raw);
  });

  it("approaches the rolling-window steady rate as more windows are observed", () => {
    let live = 0;
    const log = Array.from({ length: 20 }, (_, i) => ({
      timestamp: i * 200,
      charIndex: i,
    }));
    for (let step = 0; step < 200; step++) {
      live = computeLiveWpm(log, live);
    }
    const last = log[log.length - 1]!.timestamp;
    const first = log[0]!.timestamp;
    const raw = log.length / CHARS_PER_WORD / ((last - first) / 1000 / 60);
    expect(live).toBeCloseTo(raw, 5);
  });

  it("falls back to the last 20 keystrokes when the 3s window is too thin", () => {
    const log = buildLog([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 1000);
    const last = log[log.length - 1]!.timestamp;
    const withinDuration = log.filter(
      (k) => last - k.timestamp <= LIVE_WINDOW_MS,
    );
    expect(withinDuration.length).toBeLessThan(MIN_LIVE_CHARS);
    expect(computeLiveWpm(log, 0)).toBeGreaterThan(0);
  });

  it("caps the window at the last 20 keystrokes once they span over 3s", () => {
    const log = Array.from({ length: 24 }, (_, i) => ({
      timestamp: i * 200,
      charIndex: i,
    }));
    const last = log[log.length - 1]!.timestamp;
    const withinDuration = log.filter(
      (k) => last - k.timestamp <= LIVE_WINDOW_MS,
    );
    expect(withinDuration.length).toBeLessThan(LIVE_WINDOW_SIZE);
    const spanMs = (LIVE_WINDOW_SIZE - 1) * 200;
    const raw = LIVE_WINDOW_SIZE / CHARS_PER_WORD / (spanMs / 1000 / 60);
    expect(computeLiveWpm(log, 0)).toBeCloseTo(expectedEma(0, raw), 6);
  });

  it("is deterministic for identical inputs", () => {
    const log = steadyLog(5, 4);
    expect(computeLiveWpm(log, 10)).toBe(computeLiveWpm(log, 10));
  });
});

describe("computeWpmTimeline", () => {
  it("returns an empty timeline for an empty log", () => {
    expect(computeWpmTimeline([])).toEqual([]);
  });

  it("buckets a steady session into 1-second points", () => {
    const points = computeWpmTimeline(steadyLog(5, 14));
    expect(points.length).toBe(14);
    expect(points[0]).toEqual({ second: 1, wpm: 60 });
    expect(points[13]).toEqual({ second: 14, wpm: 60 });
  });

  it("ignores buckets with fewer than 5 characters", () => {
    const log = buildLog([5, 2, 5], 1000);
    const points = computeWpmTimeline(log);
    const seconds = points.map((p) => p.second);
    expect(seconds).toEqual([1, 3]);
  });

  it("keeps the EMA chain across ignored buckets", () => {
    const log = buildLog([5, 2, 20], 1000);
    const points = computeWpmTimeline(log);
    const rawFast = 20 / CHARS_PER_WORD / (TIMELINE_BUCKET_MS / 1000 / 60);
    const expected = TIMELINE_ALPHA * rawFast + (1 - TIMELINE_ALPHA) * 60;
    expect(points[1]).toEqual({ second: 3, wpm: Math.round(expected) });
  });

  it("labels buckets by elapsed second starting at 1", () => {
    const points = computeWpmTimeline(steadyLog(5, 3));
    expect(points.map((p) => p.second)).toEqual([1, 2, 3]);
  });

  it("emits positive rounded WPM values only", () => {
    const log = buildLog([5, 5, 8, 5, 5], 1000);
    for (const point of computeWpmTimeline(log)) {
      expect(point.wpm).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(point.wpm)).toBe(true);
    }
  });
});

describe("computeWordWpms", () => {
  function rangeFor(text: string): WordRange[] {
    const ranges: WordRange[] = [];
    let charIndex = 0;
    for (const token of text.split(" ")) {
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

  function wordLog(sizes: number[], intervalMs: number): Keystroke[] {
    const keystrokes: Keystroke[] = [];
    let globalIndex = 0;
    let timestamp = 0;
    for (const size of sizes) {
      for (let i = 0; i < size; i++) {
        keystrokes.push({ timestamp, charIndex: globalIndex });
        timestamp += intervalMs;
        globalIndex += 1;
      }
      timestamp += intervalMs;
      globalIndex += 1;
    }
    return keystrokes;
  }

  it("returns null for words typed in under one second", () => {
    const ranges = rangeFor("hello");
    const log = wordLog([5], Math.floor(WORD_MIN_DURATION_MS / 5) - 100);
    expect(computeWordWpms(ranges, log)).toEqual([null]);
  });

  it("returns null for single-character words", () => {
    const ranges = rangeFor("a");
    const log = wordLog([1], 100);
    expect(computeWordWpms(ranges, log)).toEqual([null]);
  });

  it("computes a smoothed WPM for words slow enough to measure", () => {
    const ranges = rangeFor("hello");
    const log = wordLog([5], 300);
    const raw = 5 / CHARS_PER_WORD / (1200 / 1000 / 60);
    expect(computeWordWpms(ranges, log)).toEqual([Math.round(raw)]);
  });

  it("seeds the EMA with the first measurable word", () => {
    const ranges = rangeFor("one");
    const log = wordLog([3], 500);
    const raw = 3 / CHARS_PER_WORD / (1000 / 1000 / 60);
    expect(computeWordWpms(ranges, log)).toEqual([Math.round(raw)]);
  });

  it("smooths adjacent words with the word EMA factor", () => {
    const ranges = rangeFor("hello world");
    const log: Keystroke[] = [
      ...([0, 500, 1000, 1500, 2000] as const).map((timestamp, i) => ({
        timestamp,
        charIndex: i,
      })),
      ...([2300, 2550, 2800, 3050, 3300] as const).map((timestamp, i) => ({
        timestamp,
        charIndex: i + 6,
      })),
    ];
    const rawA = 5 / CHARS_PER_WORD / (2000 / 1000 / 60);
    const rawB = 5 / CHARS_PER_WORD / (1000 / 1000 / 60);
    const second = Math.round(
      WORD_WPM_ALPHA * rawB + (1 - WORD_WPM_ALPHA) * rawA,
    );
    expect(computeWordWpms(ranges, log)).toEqual([Math.round(rawA), second]);
  });

  it("skips null words without re-seeding the EMA chain", () => {
    const ranges = rangeFor("hello a again");
    const log: Keystroke[] = [
      ...([0, 300, 600, 900, 1200] as const).map((timestamp, i) => ({
        timestamp,
        charIndex: i,
      })),
      { timestamp: 1500, charIndex: 6 },
      ...([1800, 2300, 2800, 3300, 3800] as const).map((timestamp, i) => ({
        timestamp,
        charIndex: i + 8,
      })),
    ];
    const rawA = 5 / CHARS_PER_WORD / (1200 / 1000 / 60);
    const rawC = 5 / CHARS_PER_WORD / (2000 / 1000 / 60);
    const third = Math.round(
      WORD_WPM_ALPHA * rawC + (1 - WORD_WPM_ALPHA) * Math.round(rawA),
    );
    expect(computeWordWpms(ranges, log)).toEqual([
      Math.round(rawA),
      null,
      third,
    ]);
  });

  it("excludes mid-word pauses longer than 1.5s from the active duration", () => {
    const ranges = rangeFor("hello");
    const gapAfter = WORD_PAUSE_THRESHOLD_MS + 500;
    const timestamps = [0, 200, 400, 400 + gapAfter, 400 + gapAfter + 200];
    const log = timestamps.map((timestamp, index) => ({
      timestamp,
      charIndex: index,
    }));
    const activeDuration = 400 + gapAfter + 200 - gapAfter;
    const raw = 5 / CHARS_PER_WORD / (activeDuration / 1000 / 60);
    expect(computeWordWpms(ranges, log)).toEqual([Math.round(raw)]);
  });
});

describe("buildWordStates", () => {
  function logForWords(sizes: number[], intervalMs: number): Keystroke[] {
    const keystrokes: Keystroke[] = [];
    let globalIndex = 0;
    let timestamp = 0;
    for (const size of sizes) {
      for (let i = 0; i < size; i++) {
        keystrokes.push({ timestamp, charIndex: globalIndex });
        timestamp += intervalMs;
        globalIndex += 1;
      }
      timestamp += intervalMs;
      globalIndex += 1;
    }
    return keystrokes;
  }

  it("returns an empty list for no typed text", () => {
    expect(buildWordStates("", [])).toEqual([]);
  });

  it("aligns word boundaries with char indexes in the typed text", () => {
    const log = logForWords([5, 5], 300);
    const states = buildWordStates("hello world", log);
    expect(states).toHaveLength(2);
    expect(states[0]).toMatchObject({
      wordText: "hello",
      startCharIndex: 0,
      endCharIndex: 4,
    });
    expect(states[1]).toMatchObject({
      wordText: "world",
      startCharIndex: 6,
      endCharIndex: 10,
    });
  });

  it("skips empty tokens produced by a trailing space", () => {
    const log = logForWords([5], 300);
    const states = buildWordStates("hello ", log);
    expect(states).toHaveLength(1);
    expect(states[0]!.wordText).toBe("hello");
  });

  it("provides wordWpm for each word, null when unmeasurable", () => {
    const log = logForWords([5], 300);
    const states = buildWordStates("hello", log);
    expect(states).toHaveLength(1);
    expect(typeof states[0]!.wordWpm).toBe("number");
  });
});
