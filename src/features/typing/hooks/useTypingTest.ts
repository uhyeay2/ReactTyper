import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { RootState } from "@/app/store";
import {
  startReadyTest,
  startFromHome,
  updateTypedText,
  refreshLiveWpm,
  appendTargetWords,
  completeTest,
  setElapsedTime,
  recordWpmSnapshot,
  recordLiveWpm,
  pauseTest,
  resumeTest,
  resetToReady,
  selectTypingStatus,
  selectTargetText,
  selectTypedText,
  selectCurrentIndex,
  selectErrors,
  selectCorrectChars,
  selectTotalTyped,
  selectResults,
  selectPausedElapsed,
  selectLiveWpm,
  selectLiveWpmReady,
  selectWpmTimeline,
  selectFixedChars,
} from "../state/typingSlice";
import {
  selectCurrentWpm,
  selectCurrentAccuracy,
} from "../state/typingSelectors";
import {
  selectDuration,
  selectWordCount,
  selectMaxErrors,
} from "@/features/typingConfig/state/typingConfigSlice";
import { buildResults } from "../utils/buildResults";
import { countWordsWithErrors } from "../utils/calculateWordStats";
import { getExtraWords } from "../utils/wordList";
import { computeBackspaceBoundary } from "../utils/backspaceBoundary";
import { useTimer } from "./useTimer";
import { recordResult } from "@/features/history/state/historySlice";
import { buildRecordPayload } from "@/features/history/utils/buildRecordPayload";

const WORD_BUFFER_SIZE = 20;
const DEFAULT_WORD_COUNT = 50;
const MIN_CHARS_FOR_WPM = 5;
const LIVE_WPM_REFRESH_MS = 100;

function countTypedWords(typedText: string): number {
  const trimmed = typedText.trim();
  if (trimmed.length === 0) return 0;
  const words = trimmed.split(/\s+/);
  return typedText.endsWith(" ") ? words.length : words.length - 1;
}

export function useTypingTest() {
  const dispatch = useAppDispatch();
  const typingStore = useStore<RootState>();
  const status = useAppSelector(selectTypingStatus);
  const targetText = useAppSelector(selectTargetText);
  const typedText = useAppSelector(selectTypedText);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const errors = useAppSelector(selectErrors);
  const correctChars = useAppSelector(selectCorrectChars);
  const totalTyped = useAppSelector(selectTotalTyped);
  const currentWpm = useAppSelector(selectCurrentWpm);
  const currentAccuracy = useAppSelector(selectCurrentAccuracy);
  const liveWpm = useAppSelector(selectLiveWpm);
  const liveWpmReady = useAppSelector(selectLiveWpmReady);
  const wpmTimeline = useAppSelector(selectWpmTimeline);
  const results = useAppSelector(selectResults);
  const pausedElapsed = useAppSelector(selectPausedElapsed);
  const fixedChars = useAppSelector(selectFixedChars);

  const configDuration = useAppSelector(selectDuration);
  const configMaxWords = useAppSelector(selectWordCount);
  const configMaxErrors = useAppSelector(selectMaxErrors);

  const fixedCharsRef = useRef("");
  const correctCharsRef = useRef(0);
  const errorsRef = useRef(0);
  const totalTypedRef = useRef(0);
  const backspaceBoundaryRef = useRef(0);

  const testDuration = configDuration;

  useEffect(() => {
    if (status !== "active") return;

    if (configMaxWords !== null) return;

    const charsRemaining = targetText.length - currentIndex;
    if (charsRemaining < WORD_BUFFER_SIZE * 6) {
      const extra = getExtraWords(WORD_BUFFER_SIZE);
      dispatch(
        appendTargetWords({
          targetText: targetText + " " + extra,
          wordCount: targetText.split(" ").length + WORD_BUFFER_SIZE,
        }),
      );
    }
  }, [currentIndex, targetText, status, dispatch, configMaxWords]);

  useEffect(() => {
    if (status !== "active") return;
    const intervalId = window.setInterval(() => {
      dispatch(refreshLiveWpm());
    }, LIVE_WPM_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [status, dispatch]);

  const handleTestComplete = useCallback(() => {
    const {
      typedText: finalTyped,
      targetText: finalTarget,
      totalTyped: finalTotalTyped,
      correctChars: finalCorrectChars,
      elapsedTime: finalElapsed,
      fixedChars: finalFixedChars,
      keystrokes: finalKeystrokes,
      wpmTimeline: recordedTimeline,
      sessionContext,
    } = typingStore.getState().typing;
    const authStatus = typingStore.getState().auth.status;
    const config = typingStore.getState().typingConfig;

    const { results, wpmTimeline } = buildResults({
      typedText: finalTyped,
      targetText: finalTarget,
      totalTyped: finalTotalTyped,
      correctChars: finalCorrectChars,
      elapsedTime: finalElapsed,
      fixedChars: finalFixedChars,
      keystrokes: finalKeystrokes,
      recordedTimeline,
    });

    dispatch(completeTest({ results, wpmTimeline }));

    if (authStatus === "authenticated") {
      const targetWordCount = countTypedWords(finalTarget);
      dispatch(
        recordResult(
          buildRecordPayload({
            results,
            sessionContext,
            config: {
              duration: config.duration,
              wordCount: config.wordCount,
              maxErrors: config.maxErrors,
              isZenMode: config.isZenMode,
            },
            targetWordCount,
            wpmTimeline,
          }),
        ),
      );
    }
  }, [dispatch, typingStore]);

  const handleTick = useCallback(
    (elapsedSeconds: number) => {
      dispatch(setElapsedTime(elapsedSeconds));
      if (elapsedSeconds <= 0) return;
      const typing = typingStore.getState().typing;
      dispatch(
        recordLiveWpm({
          second: elapsedSeconds,
          wpm: Math.round(typing.liveWpm),
        }),
      );
      if (typing.totalTyped < MIN_CHARS_FOR_WPM) return;
      dispatch(
        recordWpmSnapshot({
          second: typing.elapsedTime,
          totalTyped: typing.totalTyped,
          errors: typing.errors,
        }),
      );
    },
    [dispatch, typingStore],
  );

  const isTimerRunning = status === "active";
  const timerOffset = status === "active" ? pausedElapsed : 0;

  const wordsCompleted = useMemo(() => countTypedWords(typedText), [typedText]);
  const erroredWords = useMemo(
    () => countWordsWithErrors(targetText, typedText, fixedChars),
    [targetText, typedText, fixedChars],
  );

  const { timeRemaining, elapsedTime } = useTimer({
    duration: testDuration,
    isRunning: isTimerRunning,
    onComplete: handleTestComplete,
    onTick: handleTick,
    offset: timerOffset,
  });

  const handleStart = useCallback(() => {
    correctCharsRef.current = 0;
    errorsRef.current = 0;
    totalTypedRef.current = 0;
    fixedCharsRef.current = "";
    backspaceBoundaryRef.current = 0;
    if (status === "ready") {
      dispatch(startReadyTest());
    }
  }, [dispatch, status]);

  const checkCompletion = useCallback(
    (newTyped: string, newFixedChars: string) => {
      const currentTarget = typingStore.getState().typing.targetText;

      if (
        configMaxWords !== null &&
        countTypedWords(newTyped) >= configMaxWords
      ) {
        handleTestComplete();
        return true;
      }

      if (configMaxErrors !== null) {
        const wordErrors = countWordsWithErrors(
          currentTarget,
          newTyped,
          newFixedChars,
        );
        if (wordErrors >= configMaxErrors) {
          handleTestComplete();
          return true;
        }
      }

      return false;
    },
    [configMaxWords, configMaxErrors, handleTestComplete, typingStore],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;

      if (status === "ready") {
        if (key === "Backspace") return;
        if (key.length !== 1) return;
        correctCharsRef.current = 0;
        errorsRef.current = 0;
        totalTypedRef.current = 0;
        fixedCharsRef.current = "";
        backspaceBoundaryRef.current = 0;
        dispatch(startReadyTest());
      } else if (status !== "active") {
        return;
      }

      if (key === "Backspace") {
        e.preventDefault();
        if (
          currentIndex > 0 &&
          currentIndex - 1 >= backspaceBoundaryRef.current
        ) {
          const newTyped = typedText.slice(0, -1);
          const newIndex = currentIndex - 1;
          const deletedChar = typedText[currentIndex - 1];
          const targetChar = targetText[newIndex];

          let newCorrect = correctCharsRef.current;
          let newErrors = errorsRef.current;

          if (deletedChar === targetChar) {
            newCorrect = Math.max(0, newCorrect - 1);
          } else {
            newErrors = Math.max(0, newErrors - 1);
          }

          correctCharsRef.current = newCorrect;
          errorsRef.current = newErrors;
          totalTypedRef.current -= 1;

          dispatch(
            updateTypedText({
              typedText: newTyped,
              currentIndex: newIndex,
              correctChars: newCorrect,
              errors: newErrors,
              totalTyped: totalTypedRef.current,
              fixedChars: fixedCharsRef.current,
              keystroke: null,
            }),
          );
        }
        return;
      }

      if (key.length !== 1) return;

      e.preventDefault();

      if (currentIndex >= targetText.length) return;

      const targetChar = targetText[currentIndex];
      const isCorrect = key === targetChar;
      const newTyped = typedText + key;
      const newIndex = currentIndex + 1;

      backspaceBoundaryRef.current = computeBackspaceBoundary(newTyped);

      if (isCorrect) {
        correctCharsRef.current += 1;
      } else {
        errorsRef.current += 1;
      }

      const wasPreviouslyIncorrect =
        fixedCharsRef.current.length > currentIndex &&
        fixedCharsRef.current[currentIndex] === "1";
      const entry = isCorrect ? (wasPreviouslyIncorrect ? "1" : "0") : "1";

      let newFixedChars = fixedCharsRef.current;
      if (newFixedChars.length > currentIndex) {
        newFixedChars =
          newFixedChars.slice(0, currentIndex) +
          entry +
          newFixedChars.slice(currentIndex + 1);
      } else {
        newFixedChars += entry;
      }
      fixedCharsRef.current = newFixedChars;

      totalTypedRef.current += 1;

      const timestamp = performance.now();
      dispatch(
        updateTypedText({
          typedText: newTyped,
          currentIndex: newIndex,
          correctChars: correctCharsRef.current,
          errors: errorsRef.current,
          totalTyped: totalTypedRef.current,
          fixedChars: newFixedChars,
          keystroke: { timestamp, charIndex: currentIndex },
        }),
      );

      if (checkCompletion(newTyped, newFixedChars)) return;

      if (newIndex >= targetText.length) {
        handleTestComplete();
      }
    },
    [
      status,
      currentIndex,
      typedText,
      targetText,
      dispatch,
      handleTestComplete,
      checkCompletion,
    ],
  );

  const handlePause = useCallback(() => {
    dispatch(pauseTest());
  }, [dispatch]);

  const handleResume = useCallback(() => {
    dispatch(resumeTest());
  }, [dispatch]);

  const handleQuit = useCallback(() => {
    const {
      typedText: finalTyped,
      targetText: finalTarget,
      totalTyped: finalTotalTyped,
      correctChars: finalCorrectChars,
      elapsedTime: finalElapsed,
      fixedChars: finalFixedChars,
      keystrokes: finalKeystrokes,
      wpmTimeline: recordedTimeline,
    } = typingStore.getState().typing;

    const { results, wpmTimeline } = buildResults({
      typedText: finalTyped,
      targetText: finalTarget,
      totalTyped: finalTotalTyped,
      correctChars: finalCorrectChars,
      elapsedTime: finalElapsed,
      fixedChars: finalFixedChars,
      keystrokes: finalKeystrokes,
      recordedTimeline,
    });

    dispatch(completeTest({ results, wpmTimeline }));
  }, [dispatch, typingStore]);

  const handleReset = useCallback(() => {
    correctCharsRef.current = 0;
    errorsRef.current = 0;
    totalTypedRef.current = 0;
    fixedCharsRef.current = "";
    backspaceBoundaryRef.current = 0;
    dispatch(resetToReady());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    correctCharsRef.current = 0;
    errorsRef.current = 0;
    totalTypedRef.current = 0;
    fixedCharsRef.current = "";
    backspaceBoundaryRef.current = 0;
    dispatch(
      startFromHome({ wordCount: configMaxWords ?? DEFAULT_WORD_COUNT }),
    );
  }, [dispatch, configMaxWords]);

  return useMemo(
    () => ({
      status,
      targetText,
      typedText,
      currentIndex,
      currentWpm,
      currentAccuracy,
      liveWpm,
      liveWpmReady,
      wpmTimeline,
      timeRemaining,
      elapsedTime,
      errors,
      correctChars,
      totalTyped,
      wordsCompleted,
      erroredWords,
      results,
      fixedChars,
      handleStart,
      handleKeyDown,
      handlePause,
      handleResume,
      handleQuit,
      handleReset,
      handleRefresh,
    }),
    [
      status,
      targetText,
      typedText,
      currentIndex,
      currentWpm,
      currentAccuracy,
      liveWpm,
      liveWpmReady,
      wpmTimeline,
      timeRemaining,
      elapsedTime,
      errors,
      correctChars,
      totalTyped,
      wordsCompleted,
      erroredWords,
      results,
      fixedChars,
      handleStart,
      handleKeyDown,
      handlePause,
      handleResume,
      handleQuit,
      handleReset,
      handleRefresh,
    ],
  );
}
