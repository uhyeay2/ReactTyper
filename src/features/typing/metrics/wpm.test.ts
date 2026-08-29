import { describe, it, expect } from "vitest";
import {
  CHARS_PER_WORD,
  LIVE_WINDOW_MS,
  LIVE_WINDOW_SIZE,
  LIVE_WPM_ALPHA,
  MIN_LIVE_CHARS,
  MIN_LIVE_WINDOW_SECONDS,
  attachWordsToTimeline,
  backfillInitialWpm,
  buildWordStates,
  computeLiveWpm,
  isLiveWpmReady,
  type Keystroke,
  type WpmTimelinePoint,
  type WordState,
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

function timelineOf(secondsAndWpm: [number, number][]): WpmTimelinePoint[] {
  return secondsAndWpm.map(([second, wpm]) => ({ second, wpm, words: [] }));
}

describe("constants", () => {
  it("exposes the standards required by the feature", () => {
    expect(CHARS_PER_WORD).toBe(5);
    expect(LIVE_WINDOW_MS).toBe(3000);
    expect(LIVE_WINDOW_SIZE).toBe(20);
    expect(MIN_LIVE_CHARS).toBe(10);
    expect(MIN_LIVE_WINDOW_SECONDS).toBe(2);
    expect(LIVE_WPM_ALPHA).toBe(0.2);
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
    expect(computeLiveWpm(log, 50)).toBeCloseTo(expectedEma(50, raw), 6);
  });

  it("seeds the first valid emission with the true rate instead of 20% of it", () => {
    const log = steadyLog(5, 3);
    const last = log[log.length - 1]!.timestamp;
    const first = log[0]!.timestamp;
    const raw = log.length / CHARS_PER_WORD / ((last - first) / 1000 / 60);
    expect(computeLiveWpm(log, 0)).toBe(raw);
    expect(raw).toBeGreaterThan(expectedEma(0, raw));
  });

  it("never spikes: EMA blends the raw value with the previous emission", () => {
    const log = buildLog([12, 12, 12], 1000);
    const last = log[log.length - 1]!.timestamp;
    const window = log.filter((k) => last - k.timestamp <= LIVE_WINDOW_MS);
    const spanMs = last - window[0]!.timestamp;
    const raw = window.length / CHARS_PER_WORD / (spanMs / 1000 / 60);
    const first = expectedEma(30, raw);
    expect(computeLiveWpm(log, 30)).toBeCloseTo(first, 6);
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
    expect(computeLiveWpm(log, 0)).toBeCloseTo(raw, 6);
  });

  it("is deterministic for identical inputs", () => {
    const log = steadyLog(5, 4);
    expect(computeLiveWpm(log, 10)).toBe(computeLiveWpm(log, 10));
  });
});

describe("isLiveWpmReady", () => {
  it("is false for an empty log", () => {
    expect(isLiveWpmReady([])).toBe(false);
  });

  it("is false below the minimum character count", () => {
    expect(isLiveWpmReady(buildLog([9], 1000))).toBe(false);
  });

  it("is false while the window spans less than the minimum duration", () => {
    expect(
      isLiveWpmReady(buildLog([10], MIN_LIVE_WINDOW_SECONDS * 1000 - 100)),
    ).toBe(false);
  });

  it("is true once the window holds enough characters over the minimum span", () => {
    expect(isLiveWpmReady(steadyLog(5, 3))).toBe(true);
  });

  it("stays true when only the 20-keystroke fallback window is available", () => {
    expect(
      isLiveWpmReady(buildLog([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 1000)),
    ).toBe(true);
  });

  it("agrees with a non-zero computeLiveWpm emission", () => {
    const log = steadyLog(5, 3);
    expect(isLiveWpmReady(log)).toBe(true);
    expect(computeLiveWpm(log, 0)).toBeGreaterThan(0);
  });
});

describe("backfillInitialWpm", () => {
  it("returns the timeline unchanged when the first point is already valid", () => {
    const timeline = timelineOf([
      [1, 42],
      [2, 45],
    ]);
    expect(backfillInitialWpm(timeline)).toBe(timeline);
  });

  it("returns the timeline unchanged when every point is zero", () => {
    const timeline = timelineOf([
      [1, 0],
      [2, 0],
    ]);
    expect(backfillInitialWpm(timeline)).toBe(timeline);
  });

  it("returns the timeline unchanged when empty", () => {
    expect(backfillInitialWpm([])).toEqual([]);
  });

  it("back-fills leading zero points with the first valid WPM", () => {
    const timeline = timelineOf([
      [1, 0],
      [2, 0],
      [3, 42],
      [4, 55],
    ]);
    expect(backfillInitialWpm(timeline)).toEqual([
      { second: 1, wpm: 42, words: [] },
      { second: 2, wpm: 42, words: [] },
      { second: 3, wpm: 42, words: [] },
      { second: 4, wpm: 55, words: [] },
    ]);
  });

  it("does not mutate the input timeline", () => {
    const timeline = timelineOf([
      [1, 0],
      [2, 44],
    ]);
    const result = backfillInitialWpm(timeline);
    expect(result).not.toBe(timeline);
    expect(timeline[0]).toEqual({ second: 1, wpm: 0, words: [] });
    expect(result[0]).toEqual({ second: 1, wpm: 44, words: [] });
  });

  it("preserves the extra word data carried by back-filled points", () => {
    const timeline: WpmTimelinePoint[] = [
      { second: 1, wpm: 0, words: ["hello"] },
      { second: 2, wpm: 38, words: [] },
    ];
    expect(backfillInitialWpm(timeline)).toEqual([
      { second: 1, wpm: 38, words: ["hello"] },
      { second: 2, wpm: 38, words: [] },
    ]);
  });
});

describe("buildWordStates", () => {
  it("returns an empty list when there are no keystrokes", () => {
    const timeline = timelineOf([[1, 60]]);
    expect(buildWordStates("hello", [], timeline)).toEqual([]);
  });

  it("returns an empty list when there is no timeline", () => {
    const log = logForWords([5], 300);
    expect(buildWordStates("hello", log, [])).toEqual([]);
  });

  it("aligns word boundaries with char indexes in the typed text", () => {
    const log = logForWords([5, 5], 300);
    const timeline = timelineOf([
      [1, 60],
      [2, 60],
      [3, 60],
    ]);
    const states = buildWordStates("hello world", log, timeline);
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
    const timeline = timelineOf([[1, 60]]);
    const states = buildWordStates("hello ", log, timeline);
    expect(states).toHaveLength(1);
    expect(states[0]!.wordText).toBe("hello");
  });

  it("attributes each word to the second in which it completed", () => {
    const log = logForWords([5, 5], 150);
    const timeline = timelineOf([
      [1, 10],
      [2, 20],
      [3, 30],
    ]);
    const states = buildWordStates("hello world", log, timeline);
    expect(states[0]).toMatchObject({ second: 1, wpm: 10 });
    expect(states[1]).toMatchObject({ second: 2, wpm: 20 });
  });

  it("carries the WPM of the matching timeline point", () => {
    const log = logForWords([5], 200);
    const timeline = timelineOf([
      [1, 77],
      [2, 88],
    ]);
    const states = buildWordStates("hello", log, timeline);
    expect(states[0]).toMatchObject({ second: 1, wpm: 77 });
  });

  it("falls back to the nearest timeline second when none matches", () => {
    const log = logForWords([5], 800);
    const states = buildWordStates(
      "hello",
      log,
      timelineOf([
        [1, 40],
        [2, 44],
        [5, 70],
      ]),
    );
    expect(states[0]).toMatchObject({ second: 5, wpm: 70 });
  });

  it("is consistent: a word's WPM equals its attributed graph point", () => {
    const log = logForWords([5, 5], 200);
    const timeline = timelineOf([
      [1, 40],
      [2, 60],
    ]);
    const states = buildWordStates("hello world", log, timeline);
    for (const state of states) {
      const point = timeline.find((p) => p.second === state.second);
      expect(point).toBeDefined();
      expect(state.wpm).toBe(point!.wpm);
    }
  });
});

describe("attachWordsToTimeline", () => {
  it("groups word texts onto the point for their second", () => {
    const wordStates: WordState[] = [
      {
        wordText: "hello",
        startCharIndex: 0,
        endCharIndex: 4,
        second: 1,
        wpm: 40,
      },
      {
        wordText: "world",
        startCharIndex: 6,
        endCharIndex: 10,
        second: 1,
        wpm: 40,
      },
      {
        wordText: "again",
        startCharIndex: 12,
        endCharIndex: 16,
        second: 2,
        wpm: 50,
      },
    ];
    expect(
      attachWordsToTimeline(
        timelineOf([
          [1, 40],
          [2, 50],
        ]),
        wordStates,
      ),
    ).toEqual([
      { second: 1, wpm: 40, words: ["hello", "world"] },
      { second: 2, wpm: 50, words: ["again"] },
    ]);
  });

  it("leaves points empty when no words fall in their second", () => {
    const timeline = timelineOf([
      [1, 40],
      [3, 60],
    ]);
    expect(attachWordsToTimeline(timeline, [])).toEqual([
      { second: 1, wpm: 40, words: [] },
      { second: 3, wpm: 60, words: [] },
    ]);
  });

  it("does not mutate the input timeline", () => {
    const timeline = timelineOf([[1, 40]]);
    const wordStates: WordState[] = [
      {
        wordText: "hi",
        startCharIndex: 0,
        endCharIndex: 1,
        second: 1,
        wpm: 40,
      },
    ];
    const result = attachWordsToTimeline(timeline, wordStates);
    expect(result).not.toBe(timeline);
    expect(timeline[0]).toEqual({ second: 1, wpm: 40, words: [] });
    expect(result[0]).toEqual({ second: 1, wpm: 40, words: ["hi"] });
  });
});
