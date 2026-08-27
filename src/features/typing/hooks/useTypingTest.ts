import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { store } from "@/app/store";
import {
  readyTest,
  startReadyTest,
  updateTypedText,
  appendTargetWords,
  completeTest,
  setElapsedTime,
  pauseTest,
  resumeTest,
  resetToReady,
  refreshTest,
  selectTypingStatus,
  selectTargetText,
  selectTypedText,
  selectCurrentIndex,
  selectErrors,
  selectCorrectChars,
  selectTotalTyped,
  selectResults,
  selectPausedElapsed,
} from "../state/typingSlice";
import {
  selectCurrentWpm,
  selectCurrentAccuracy,
} from "../state/typingSelectors";
import { calculateGrossWpm, calculateNetWpm } from "../utils/calculateWpm";
import { calculateAccuracy } from "../utils/calculateAccuracy";
import { getExtraWords } from "../utils/wordList";
import { useTimer } from "./useTimer";

const TEST_DURATION = 60;
const WORD_BUFFER_SIZE = 20;

export function useTypingTest() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectTypingStatus);
  const targetText = useAppSelector(selectTargetText);
  const typedText = useAppSelector(selectTypedText);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const errors = useAppSelector(selectErrors);
  const correctChars = useAppSelector(selectCorrectChars);
  const totalTyped = useAppSelector(selectTotalTyped);
  const currentWpm = useAppSelector(selectCurrentWpm);
  const currentAccuracy = useAppSelector(selectCurrentAccuracy);
  const results = useAppSelector(selectResults);
  const pausedElapsed = useAppSelector(selectPausedElapsed);

  const fixedCharsRef = useRef("");
  const correctCharsRef = useRef(0);
  const errorsRef = useRef(0);
  const totalTypedRef = useRef(0);

  useEffect(() => {
    if (status !== "active") return;
    const charsRemaining = targetText.length - currentIndex;
    if (charsRemaining < WORD_BUFFER_SIZE * 6) {
      const extra = getExtraWords(WORD_BUFFER_SIZE);
      dispatch(appendTargetWords({
        targetText: targetText + " " + extra,
        wordCount: targetText.split(" ").length + WORD_BUFFER_SIZE,
      }));
    }
  }, [currentIndex, targetText, status, dispatch]);

  const handleTestComplete = useCallback(() => {
    const { typedText: finalTyped, targetText: finalTarget, totalTyped: finalTotalTyped, correctChars: finalCorrectChars } = store.getState().typing;

    let finalErrs = 0;
    for (let i = 0; i < finalTyped.length && i < finalTarget.length; i++) {
      if (finalTyped[i] !== finalTarget[i]) finalErrs++;
    }

    const elapsedMinutes = TEST_DURATION / 60;
    const gross = calculateGrossWpm(finalTotalTyped, elapsedMinutes);
    const net = calculateNetWpm(gross, finalErrs, elapsedMinutes);
    const acc = calculateAccuracy(finalCorrectChars, finalTotalTyped);

    dispatch(
      completeTest({
        results: {
          wpm: net,
          grossWpm: gross,
          accuracy: acc,
          correctChars: finalCorrectChars,
          incorrectChars: finalErrs,
          elapsedTime: TEST_DURATION,
        },
      }),
    );
  }, [dispatch]);

  const handleTick = useCallback(
    (elapsedSeconds: number) => {
      dispatch(setElapsedTime(elapsedSeconds));
    },
    [dispatch],
  );

  const isTimerRunning = status === "active";
  const timerOffset = status === "active" ? pausedElapsed : 0;

  const { timeRemaining, elapsedTime } = useTimer({
    duration: TEST_DURATION,
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
    if (status === "idle") {
      dispatch(readyTest());
    } else if (status === "ready") {
      dispatch(startReadyTest());
    }
  }, [dispatch, status]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;

      if (status === "idle") {
        if (key.length !== 1 && key !== "Backspace") return;
        dispatch(readyTest());
        return;
      }

      if (status === "ready") {
        if (key === "Backspace") return;
        if (key.length !== 1) return;
        correctCharsRef.current = 0;
        errorsRef.current = 0;
        totalTypedRef.current = 0;
        fixedCharsRef.current = "";
        dispatch(startReadyTest());
      } else if (status !== "active") {
        return;
      }

      if (key === "Backspace") {
        e.preventDefault();
        if (currentIndex > 0) {
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

      if (isCorrect) {
        correctCharsRef.current += 1;
      } else {
        errorsRef.current += 1;
      }

      const wasPreviouslyIncorrect =
        fixedCharsRef.current.length > currentIndex &&
        fixedCharsRef.current[currentIndex] === "1";
      const entry = isCorrect ? (wasPreviouslyIncorrect ? "1" : "0") : "1";

      if (fixedCharsRef.current.length > currentIndex) {
        fixedCharsRef.current =
          fixedCharsRef.current.slice(0, currentIndex) +
          entry +
          fixedCharsRef.current.slice(currentIndex + 1);
      } else {
        fixedCharsRef.current += entry;
      }

      totalTypedRef.current += 1;

      dispatch(
        updateTypedText({
          typedText: newTyped,
          currentIndex: newIndex,
          correctChars: correctCharsRef.current,
          errors: errorsRef.current,
          totalTyped: totalTypedRef.current,
          fixedChars: fixedCharsRef.current,
        }),
      );

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
    ],
  );

  const handlePause = useCallback(() => {
    dispatch(pauseTest());
  }, [dispatch]);

  const handleResume = useCallback(() => {
    dispatch(resumeTest());
  }, [dispatch]);

  const handleQuit = useCallback(() => {
    const { typedText: finalTyped, targetText: finalTarget, totalTyped: finalTotalTyped, correctChars: finalCorrectChars } = store.getState().typing;

    let finalErrs = 0;
    for (let i = 0; i < finalTyped.length && i < finalTarget.length; i++) {
      if (finalTyped[i] !== finalTarget[i]) finalErrs++;
    }

    const elapsedMinutes = elapsedTime / 60;
    const gross =
      elapsedMinutes > 0
        ? calculateGrossWpm(finalTotalTyped, elapsedMinutes)
        : 0;
    const net =
      elapsedMinutes > 0
        ? calculateNetWpm(gross, finalErrs, elapsedMinutes)
        : 0;
    const acc = calculateAccuracy(finalCorrectChars, finalTotalTyped);

    dispatch(
      completeTest({
        results: {
          wpm: net,
          grossWpm: gross,
          accuracy: acc,
          correctChars: finalCorrectChars,
          incorrectChars: finalErrs,
          elapsedTime,
        },
      }),
    );
  }, [dispatch, elapsedTime]);

  const handleReset = useCallback(() => {
    correctCharsRef.current = 0;
    errorsRef.current = 0;
    totalTypedRef.current = 0;
    fixedCharsRef.current = "";
    dispatch(resetToReady());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    correctCharsRef.current = 0;
    errorsRef.current = 0;
    totalTypedRef.current = 0;
    fixedCharsRef.current = "";
    dispatch(refreshTest());
  }, [dispatch]);

  return useMemo(
    () => ({
      status,
      targetText,
      typedText,
      currentIndex,
      currentWpm,
      currentAccuracy,
      timeRemaining,
      elapsedTime,
      errors,
      correctChars,
      totalTyped,
      results,
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
      timeRemaining,
      elapsedTime,
      errors,
      correctChars,
      totalTyped,
      results,
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
