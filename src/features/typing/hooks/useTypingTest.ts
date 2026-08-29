import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { store } from "@/app/store";
import {
  startReadyTest,
  startFromHome,
  updateTypedText,
  appendTargetWords,
  completeTest,
  setElapsedTime,
  recordWpmSnapshot,
  pauseTest,
  resumeTest,
  selectTypingStatus,
  selectTargetText,
  selectTypedText,
  selectCurrentIndex,
  selectErrors,
  selectCorrectChars,
  selectTotalTyped,
  selectResults,
  selectPausedElapsed,
  selectWpmHistory,
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
import { calculateGrossWpm, calculateNetWpm } from "../utils/calculateWpm";
import { calculateAccuracy } from "../utils/calculateAccuracy";
import { getExtraWords } from "../utils/wordList";
import { useTimer } from "./useTimer";

const WORD_BUFFER_SIZE = 20;
const DEFAULT_WORD_COUNT = 50;
const MIN_CHARS_FOR_WPM = 5;

function countWordsWithErrors(
  targetText: string,
  typedText: string,
  fixedChars: string,
): number {
  const targetWords = targetText.split(" ");
  let charIndex = 0;
  let wordErrors = 0;

  for (const word of targetWords) {
    let hasError = false;
    for (let i = 0; i < word.length; i++) {
      const ti = charIndex + i;
      if (ti < typedText.length && ti < targetText.length) {
        if (typedText[ti] !== targetText[ti]) {
          hasError = true;
          break;
        }
        if (fixedChars.length > ti && fixedChars[ti] === "1") {
          hasError = true;
          break;
        }
      }
    }
    if (hasError) wordErrors++;
    charIndex += word.length + 1;
  }

  return wordErrors;
}

function countTypedWords(typedText: string): number {
  const trimmed = typedText.trim();
  if (trimmed.length === 0) return 0;
  const words = trimmed.split(/\s+/);
  return typedText.endsWith(" ") ? words.length : words.length - 1;
}

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
  const wpmHistory = useAppSelector(selectWpmHistory);
  const fixedChars = useAppSelector(selectFixedChars);

  const configDuration = useAppSelector(selectDuration);
  const configMaxWords = useAppSelector(selectWordCount);
  const configMaxErrors = useAppSelector(selectMaxErrors);

  const fixedCharsRef = useRef("");
  const correctCharsRef = useRef(0);
  const errorsRef = useRef(0);
  const totalTypedRef = useRef(0);

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

  const handleTestComplete = useCallback(() => {
    const {
      typedText: finalTyped,
      targetText: finalTarget,
      totalTyped: finalTotalTyped,
      correctChars: finalCorrectChars,
      elapsedTime: finalElapsed,
      fixedChars: finalFixedChars,
    } = store.getState().typing;

    let finalErrs = 0;
    for (
      let i = 0;
      i < finalTyped.length && i < finalTarget.length;
      i++
    ) {
      if (finalTyped[i] !== finalTarget[i]) finalErrs++;
    }

    const elapsed = finalElapsed;
    const elapsedMinutes = elapsed > 0 ? elapsed / 60 : 1 / 60;
    const gross = calculateGrossWpm(finalTotalTyped, elapsedMinutes);
    const net = calculateNetWpm(gross, finalErrs, elapsedMinutes);
    const acc = calculateAccuracy(finalCorrectChars, finalTotalTyped);

    const wordErrors = countWordsWithErrors(
      finalTarget,
      finalTyped,
      finalFixedChars,
    );

    dispatch(
      completeTest({
        results: {
          wpm: net,
          grossWpm: gross,
          accuracy: acc,
          correctChars: finalCorrectChars,
          incorrectChars: wordErrors,
          elapsedTime: elapsed,
        },
      }),
    );
  }, [dispatch]);

  const handleTick = useCallback(
    (elapsedSeconds: number) => {
      dispatch(setElapsedTime(elapsedSeconds));
      if (elapsedSeconds <= 0) return;
      const typing = store.getState().typing;
      if (typing.totalTyped < MIN_CHARS_FOR_WPM) return;
      dispatch(
        recordWpmSnapshot({
          second: typing.elapsedTime,
          totalTyped: typing.totalTyped,
          errors: typing.errors,
        }),
      );
    },
    [dispatch],
  );

  const isTimerRunning = status === "active";
  const timerOffset = status === "active" ? pausedElapsed : 0;

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
    if (status === "ready") {
      dispatch(startReadyTest());
    }
  }, [dispatch, status]);

  const checkCompletion = useCallback(
    (
      newTyped: string,
      newFixedChars: string,
    ) => {
      const currentTarget = store.getState().typing.targetText;

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
    [configMaxWords, configMaxErrors, handleTestComplete],
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
      const entry = isCorrect
        ? wasPreviouslyIncorrect
          ? "1"
          : "0"
        : "1";

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

      dispatch(
        updateTypedText({
          typedText: newTyped,
          currentIndex: newIndex,
          correctChars: correctCharsRef.current,
          errors: errorsRef.current,
          totalTyped: totalTypedRef.current,
          fixedChars: newFixedChars,
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
    } = store.getState().typing;

    let finalErrs = 0;
    for (
      let i = 0;
      i < finalTyped.length && i < finalTarget.length;
      i++
    ) {
      if (finalTyped[i] !== finalTarget[i]) finalErrs++;
    }

    const elapsed = finalElapsed;
    const elapsedMinutes = elapsed > 0 ? elapsed / 60 : 1 / 60;
    const gross =
      elapsedMinutes > 0
        ? calculateGrossWpm(finalTotalTyped, elapsedMinutes)
        : 0;
    const net =
      elapsedMinutes > 0
        ? calculateNetWpm(gross, finalErrs, elapsedMinutes)
        : 0;
    const acc = calculateAccuracy(finalCorrectChars, finalTotalTyped);

    const wordErrors = countWordsWithErrors(
      finalTarget,
      finalTyped,
      finalFixedChars,
    );

    dispatch(
      completeTest({
        results: {
          wpm: net,
          grossWpm: gross,
          accuracy: acc,
          correctChars: finalCorrectChars,
          incorrectChars: wordErrors,
          elapsedTime: elapsed,
        },
      }),
    );
  }, [dispatch]);

  const handleReset = useCallback(() => {
    correctCharsRef.current = 0;
    errorsRef.current = 0;
    totalTypedRef.current = 0;
    fixedCharsRef.current = "";
    dispatch(
      startFromHome({ wordCount: configMaxWords ?? DEFAULT_WORD_COUNT }),
    );
  }, [dispatch, configMaxWords]);

  const handleRefresh = useCallback(() => {
    correctCharsRef.current = 0;
    errorsRef.current = 0;
    totalTypedRef.current = 0;
    fixedCharsRef.current = "";
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
      timeRemaining,
      elapsedTime,
      errors,
      correctChars,
      totalTyped,
      results,
      wpmHistory,
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
      timeRemaining,
      elapsedTime,
      errors,
      correctChars,
      totalTyped,
      results,
      wpmHistory,
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
