import { useCallback, useLayoutEffect, useEffect, useMemo, useRef } from "react";
import { useStore } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { RootState } from "@/app/store";
import {
  startGame,
  setGameStatus,
  addWord,
  setNextWord,
  removeActiveWord,
  setTyped,
  appendCompleted,
  setMetrics,
  setElapsedTime,
  setBufferError,
  completeGame,
  resetGame,
  selectWordDropStatus,
  selectWordDropWords,
  selectWordDropNextWord,
  selectWordDropTyped,
  selectWordDropCompleted,
  selectWordDropMetrics,
  selectWordDropElapsed,
  selectWordDropBufferError,
  selectWordDropResults,
} from "../state/gamesSlice";
import type {
  WordDropMetrics,
  WordDropResults,
  WordDropStackedWord,
  WordDropWordQuality,
} from "../state/gamesTypes";
import {
  selectDuration,
  selectWordCount,
  selectMaxErrors,
  selectIsZenMode,
  selectWordBankSlug,
} from "@/features/typingConfig/state/typingConfigSlice";
import { selectAuthStatus } from "@/features/auth/state/authSlice";
import { recordResult } from "@/features/history/state/historySlice";
import { computeWordScore, computeAccuracy } from "../utils/scoring";
import {
  spawnIntervalSeconds,
  fallDurationSeconds,
  LOSE_STACK_SIZE,
  CHARS_PER_WORD,
  MIN_WORD_DURATION_SECONDS,
} from "../utils/wordDropEngine";
import { getNextGameWord } from "../services/wordDropSource";
import { buildWordDropRecord } from "../utils/buildWordDropRecord";

let wordIdCounter = 1;

function nextWordId(): number {
  return wordIdCounter++;
}

interface SimState {
  lastFrame: number;
  elapsed: number;
  spawnAcc: number;
  spawnedCount: number;
}

interface WordAccumulator {
  hadBackspace: boolean;
  incorrectKeystrokes: number;
  wordStart: number;
}

interface GlobalAccumulator {
  correctChars: number;
  incorrectChars: number;
  totalKeystrokes: number;
  score: number;
  sumWpm: number;
  highestWpm: number;
  lowestWpm: number;
}

function emptyGlobal(): GlobalAccumulator {
  return {
    correctChars: 0,
    incorrectChars: 0,
    totalKeystrokes: 0,
    score: 0,
    sumWpm: 0,
    highestWpm: 0,
    lowestWpm: 0,
  };
}

/**
 * Derives the metrics snapshot from the authoritative list of processed words
 * (completed plus any words left unfinished when the game ended). Pure and
 * deterministic.
 */
function buildMetrics(
  recorded: WordDropStackedWord[],
  global: GlobalAccumulator,
  elapsed: number,
  maxWordsReached: boolean,
): WordDropMetrics {
  let perfect = 0;
  let corrected = 0;
  let errored = 0;
  let lowest = Infinity;
  let highest = 0;
  let wpmSum = 0;
  let completed = 0;

  for (const word of recorded) {
    if (word.quality === "perfect") perfect += 1;
    else if (word.quality === "corrected") corrected += 1;
    else errored += 1;

    if (word.quality !== "errored") {
      completed += 1;
      wpmSum += word.wpm;
      if (word.wpm < lowest) lowest = word.wpm;
      if (word.wpm > highest) highest = word.wpm;
    }
  }

  return {
    accuracy: computeAccuracy(global.correctChars, global.incorrectChars),
    correctCharacters: global.correctChars,
    incorrectCharacters: global.incorrectChars,
    totalCharactersTyped: global.totalKeystrokes,
    wordsCompleted: completed,
    wordsPerfect: perfect,
    wordsCorrected: corrected,
    wordsErrored: errored,
    score: global.score,
    elapsedTime: Math.floor(elapsed),
    maxWordsReached,
    averageWpm: completed > 0 ? wpmSum / completed : 0,
    highestWpm: completed > 0 ? highest : 0,
    lowestWpm: completed > 0 ? lowest : 0,
  };
}

/**
 * Drives the Word Drop game. A vertical stack of words is anchored at the
 * bottom of the field; the bottom word is the active typing target and remains
 * typeable after it lands. New words spawn from the top at an accelerating
 * cadence (starting at 10 WPM). Completing the bottom word scores it and
 * removes it, shifting the remaining words down. The game ends on a
 * time/word/error limit, or when a fourth word would stack.
 */
export function useWordDrop() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  const status = useAppSelector(selectWordDropStatus);
  const words = useAppSelector(selectWordDropWords);
  const nextWord = useAppSelector(selectWordDropNextWord);
  const typed = useAppSelector(selectWordDropTyped);
  const completed = useAppSelector(selectWordDropCompleted);
  const metrics = useAppSelector(selectWordDropMetrics);
  const elapsed = useAppSelector(selectWordDropElapsed);
  const bufferError = useAppSelector(selectWordDropBufferError);
  const results = useAppSelector(selectWordDropResults);

  const configDuration = useAppSelector(selectDuration);
  const configWordCount = useAppSelector(selectWordCount);
  const configMaxErrors = useAppSelector(selectMaxErrors);
  const configZenMode = useAppSelector(selectIsZenMode);
  const configWordBankSlug = useAppSelector(selectWordBankSlug);
  const authStatus = useAppSelector(selectAuthStatus);

  const simRef = useRef<SimState>({
    lastFrame: 0,
    elapsed: 0,
    spawnAcc: 0,
    spawnedCount: 0,
  });
  const wordAccumRef = useRef<WordAccumulator>({
    hadBackspace: false,
    incorrectKeystrokes: 0,
    wordStart: 0,
  });
  const globalRef = useRef<GlobalAccumulator>(emptyGlobal());
  const activeRef = useRef(false);

  const timeLimit = configZenMode ? null : configDuration;

  const resetActiveAccumulator = useCallback(() => {
    wordAccumRef.current = {
      hadBackspace: false,
      incorrectKeystrokes: 0,
      wordStart: simRef.current.elapsed,
    };
  }, []);

  const endGame = useCallback(
    (maxWordsReached: boolean) => {
      activeRef.current = false;
      const snap = store.getState().wordDrop;
      const global = globalRef.current;

      const recorded: WordDropStackedWord[] = [
        ...snap.completed,
        ...snap.words.map((queued) => ({
          id: queued.id,
          word: queued.text,
          quality: "errored" as WordDropWordQuality,
          completedAt: simRef.current.elapsed,
          wpm: 0,
        })),
      ];

      const gameMetrics = buildMetrics(
        recorded,
        global,
        simRef.current.elapsed,
        maxWordsReached,
      );
      const resultsPayload: WordDropResults = {
        accuracy: gameMetrics.accuracy,
        correctCharacters: gameMetrics.correctCharacters,
        incorrectCharacters: gameMetrics.incorrectCharacters,
        totalCharactersTyped: gameMetrics.totalCharactersTyped,
        wordsCompleted: gameMetrics.wordsCompleted,
        wordsPerfect: gameMetrics.wordsPerfect,
        wordsCorrected: gameMetrics.wordsCorrected,
        wordsErrored: gameMetrics.wordsErrored,
        score: gameMetrics.score,
        elapsedTime: gameMetrics.elapsedTime,
        maxWordsReached,
        averageWpm: gameMetrics.averageWpm,
        highestWpm: gameMetrics.highestWpm,
        lowestWpm: gameMetrics.lowestWpm,
        timeLimit,
        wordLimit: configWordCount,
        maxErrors: configMaxErrors,
        isZenMode: configZenMode,
        wordBankSlug: configWordBankSlug,
        stacked: recorded,
      };
      dispatch(setMetrics(gameMetrics));
      dispatch(completeGame(resultsPayload));

      if (authStatus === "authenticated") {
        dispatch(recordResult(buildWordDropRecord(resultsPayload)));
      }
    },
    [dispatch, store, timeLimit, configZenMode, configWordCount, configMaxErrors, configWordBankSlug, authStatus],
  );

  const dispatchMetrics = useCallback(
    (maxWordsReached = false) => {
      const snap = store.getState().wordDrop;
      dispatch(
        setMetrics(
          buildMetrics(
            snap.completed,
            globalRef.current,
            simRef.current.elapsed,
            maxWordsReached,
          ),
        ),
      );
    },
    [dispatch, store],
  );

  /**
   * Consumes the currently previewed next word (falling back to a fresh draw
   * if none is present) and schedules the word that follows it as the new
   * preview. The preview is cleared once the word budget is exhausted so the
   * UI never advertises a word that will not spawn.
   */
  const spawnNextWord = useCallback((): string => {
    const snap = store.getState().wordDrop;
    const word = snap.nextWord || getNextGameWord();
    simRef.current.spawnedCount += 1;
    const budget = snap.sessionContext.wordLimit;
    const budgetReached =
      budget !== null && simRef.current.spawnedCount >= budget;
    dispatch(setNextWord(budgetReached ? "" : getNextGameWord()));
    return word;
  }, [store, dispatch]);

  const completeActiveWord = useCallback(() => {
    const snap = store.getState().wordDrop;
    const active = snap.words[0];
    if (!active) {
      resetActiveAccumulator();
      return;
    }

    const global = globalRef.current;
    const wordAccum = wordAccumRef.current;
    const wpmAtCompletion =
      simRef.current.elapsed - wordAccum.wordStart;

    const wpm =
      wpmAtCompletion >= MIN_WORD_DURATION_SECONDS
        ? active.text.length / CHARS_PER_WORD / (wpmAtCompletion / 60)
        : 0;

    const hadCorrection =
      wordAccum.hadBackspace || wordAccum.incorrectKeystrokes > 0;
    const quality: WordDropWordQuality = hadCorrection ? "corrected" : "perfect";

    const { total } = computeWordScore(quality, wpm);
    global.score += total;
    global.sumWpm += wpm;
    if (global.highestWpm < wpm) global.highestWpm = wpm;
    if (global.lowestWpm === 0 || global.lowestWpm > wpm) global.lowestWpm = wpm;

    dispatch(
      appendCompleted({
        completed: {
          id: active.id,
          word: active.text,
          quality,
          completedAt: simRef.current.elapsed,
          wpm,
        },
      }),
    );
    dispatch(removeActiveWord());
    resetActiveAccumulator();

    const session = store.getState().wordDrop.sessionContext;
    const remaining = store.getState().wordDrop.words;
    const budget = session.wordLimit ?? Infinity;
    const budgetExhausted =
      session.wordLimit !== null && simRef.current.spawnedCount >= session.wordLimit;

    if (!session.isZenMode && budgetExhausted && remaining.length === 0) {
      endGame(true);
      return;
    }

    if (remaining.length === 0 && simRef.current.spawnedCount < budget) {
      simRef.current.spawnAcc = 0;
      dispatch(addWord({ id: nextWordId(), text: spawnNextWord() }));
    }
    dispatchMetrics();
  }, [store, dispatch, dispatchMetrics, resetActiveAccumulator, spawnNextWord, endGame]);

  const handleStart = useCallback(() => {
    const sim = simRef.current;
    sim.elapsed = 0;
    sim.spawnAcc = 0;
    sim.spawnedCount = 1;
    sim.lastFrame = performance.now();
    globalRef.current = emptyGlobal();
    resetActiveAccumulator();

    const context = {
      timeLimit,
      wordLimit: configWordCount,
      maxErrors: configMaxErrors,
      isZenMode: configZenMode,
      wordBankSlug: configWordBankSlug,
    };

    const firstWord = { id: nextWordId(), text: getNextGameWord() };
    const initialNextWord =
      configWordCount !== null && sim.spawnedCount >= configWordCount
        ? ""
        : getNextGameWord();
    dispatch(
      startGame({
        words: [firstWord],
        nextWord: initialNextWord,
        sessionContext: context,
      }),
    );
    dispatch(setGameStatus("active"));
    dispatchMetrics();
  }, [dispatch, timeLimit, configWordCount, configMaxErrors, configZenMode, configWordBankSlug, resetActiveAccumulator, dispatchMetrics]);

  useLayoutEffect(() => {
    // The redux state persists across route navigation, so a previous game's
    // results could otherwise resurface when the screen is revisited. Reset
    // synchronously before paint so arriving at Word Drop always shows the
    // settings/start screen without a flash of the old results.
    dispatch(resetGame());
  }, [dispatch]);

  useEffect(() => {
    if (status !== "active") return;
    activeRef.current = true;
    const sim = simRef.current;
    sim.lastFrame = performance.now();

    let frameId = 0;
    const frame = (now: number) => {
      if (!activeRef.current) return;
      const dtSeconds = Math.min(0.05, (now - sim.lastFrame) / 1000);
      sim.lastFrame = now;
      sim.elapsed += dtSeconds;
      sim.spawnAcc += dtSeconds;

      const budget = store.getState().wordDrop.sessionContext.wordLimit;
      const spawnBudget = budget ?? Infinity;

      if (sim.spawnAcc > 0) {
        let interval = spawnIntervalSeconds(sim.elapsed);
        while (sim.spawnAcc >= interval && sim.spawnedCount < spawnBudget) {
          sim.spawnAcc -= interval;
          const snap = store.getState().wordDrop;
          // A fourth word may fall in, but we never spawn a fifth: the game is
          // lost when that fourth word actually lands (see handleStackOverflow).
          if (snap.words.length >= LOSE_STACK_SIZE) {
            sim.spawnAcc = 0;
            break;
          }
          dispatch(addWord({ id: nextWordId(), text: spawnNextWord() }));
          interval = spawnIntervalSeconds(sim.elapsed);
        }
      }

      const session = store.getState().wordDrop.sessionContext;
      if (!session.isZenMode && session.timeLimit !== null && sim.elapsed >= session.timeLimit) {
        endGame(false);
        return;
      }

      const snap = store.getState().wordDrop;
      const floor = Math.floor(sim.elapsed);
      if (floor !== snap.elapsedTime) {
        dispatch(setElapsedTime(floor));
      }

      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      activeRef.current = false;
    };
  }, [status, dispatch, store, endGame, spawnNextWord]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;

      if (status === "ready" || status === "idle") {
        if (key.length !== 1) return;
        e.preventDefault();
        handleStart();
      } else if (status !== "active") {
        return;
      }

      const storeState = store.getState().wordDrop;
      const active = storeState.words[0];
      if (!active) return;

      if (key === "Backspace") {
        e.preventDefault();
        if (storeState.typed.length > 0) {
          wordAccumRef.current.hadBackspace = true;
          dispatch(setTyped(storeState.typed.slice(0, -1)));
          dispatch(setBufferError(false));
        }
        return;
      }

      if (key.length !== 1) return;
      e.preventDefault();

      const expected = active.text[storeState.typed.length];
      if (expected === undefined) return;

      const global = globalRef.current;
      global.totalKeystrokes += 1;

      if (key === expected) {
        global.correctChars += 1;
        const newTyped = storeState.typed + key;
        dispatch(setTyped(newTyped));
        dispatch(setBufferError(false));

        const { maxErrors, isZenMode } = store.getState().wordDrop.sessionContext;
        if (!isZenMode && maxErrors !== null && global.incorrectChars >= maxErrors) {
          endGame(false);
          return;
        }

        if (newTyped.length === active.text.length) {
          completeActiveWord();
        }
      } else {
        global.incorrectChars += 1;
        wordAccumRef.current.incorrectKeystrokes += 1;
        dispatch(setBufferError(true));

        const { maxErrors, isZenMode } = store.getState().wordDrop.sessionContext;
        if (!isZenMode && maxErrors !== null && global.incorrectChars >= maxErrors) {
          endGame(false);
        }
      }
    },
    [status, store, dispatch, handleStart, completeActiveWord, endGame],
  );

  const handleQuit = useCallback(() => {
    if (status === "active" || status === "ready") {
      endGame(false);
    }
  }, [status, endGame]);

  const handleStackOverflow = useCallback(() => {
    endGame(false);
  }, [endGame]);

  const handleReset = useCallback(() => {
    activeRef.current = false;
    globalRef.current = emptyGlobal();
    simRef.current.spawnAcc = 0;
    dispatch(resetGame());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    activeRef.current = false;
    dispatch(resetGame());
  }, [dispatch]);

  const liveWpm = useMemo(() => {
    if (completed.length === 0) return 0;
    return Math.round(metrics.averageWpm);
  }, [completed.length, metrics.averageWpm]);

  const fallDuration = fallDurationSeconds(elapsed);

  return {
    status,
    words,
    nextWord,
    typed,
    completed,
    metrics,
    elapsed,
    bufferError,
    results,
    liveWpm,
    fallDuration,
    handleStart,
    handleKeyDown,
    handleQuit,
    handleStackOverflow,
    handleReset,
    handleRefresh,
  };
}
