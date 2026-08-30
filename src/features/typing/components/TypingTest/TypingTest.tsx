import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  selectDuration,
  selectWordCount,
  selectMaxErrors,
  selectIsZenMode,
} from "@/features/typingConfig/state/typingConfigSlice";
import { formatConfigSummary } from "@/features/typingConfig/utils/formatConfigSummary";
import { SessionTypeValue } from "@/features/history/state/historyTypes";
import { apiGetLesson } from "@/features/lessons/services/lessonsApi";
import type { LessonUnit } from "@/features/lessons/state/lessonTypes";
import {
  navigateHome,
  startLessonSession,
  selectSessionContext,
  selectIsLessonSession,
} from "../../state/typingSlice";
import { useTypingTest } from "../../hooks/useTypingTest";
import { TypingDisplay } from "../TypingDisplay/TypingDisplay";
import { TypingInput } from "../TypingInput/TypingInput";
import { LiveWpm } from "../LiveWpm/LiveWpm";
import { ResultsDisplay } from "../ResultsDisplay/ResultsDisplay";
import { TestConfigOptions } from "@/shared/components/TestConfigOptions/TestConfigOptions";
import { CollapsibleSection } from "@/shared/components/CollapsibleSection/CollapsibleSection";
import { logger } from "@/infrastructure/logging/logger";
import styles from "./TypingTest.module.css";

const TEST_SETTINGS_STORAGE_KEY = "reacttyper-results-test-settings";

export function TypingTest() {
  const configDuration = useAppSelector(selectDuration);
  const configWordCount = useAppSelector(selectWordCount);
  const configMaxErrors = useAppSelector(selectMaxErrors);
  const isZenMode = useAppSelector(selectIsZenMode);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isLessonSession = useAppSelector(selectIsLessonSession);
  const sessionContext = useAppSelector(selectSessionContext);

  const {
    status,
    targetText,
    typedText,
    currentIndex,
    fixedChars,
    currentWpm,
    liveWpm,
    liveWpmReady,
    currentAccuracy,
    wpmTimeline,
    timeRemaining,
    elapsedTime,
    wordsCompleted,
    erroredWords,
    results,
    handleKeyDown,
    handlePause,
    handleResume,
    handleQuit,
    handleReset,
    handleRefresh,
  } = useTypingTest();

  const [lessonUnits, setLessonUnits] = useState<LessonUnit[] | null>(null);
  const [nextUnitError, setNextUnitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLessonSession || status !== "completed") return;
    const slug = sessionContext.lessonSlug;
    if (slug === null) return;
    let cancelled = false;
    apiGetLesson(slug)
      .then((lesson) => {
        if (cancelled) return;
        setLessonUnits(lesson.units);
        setNextUnitError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setNextUnitError("Unable to load the next lesson.");
      });
    return () => {
      cancelled = true;
    };
  }, [isLessonSession, status, sessionContext.lessonSlug]);

  const currentUnitOrder = sessionContext.lessonUnitOrder;

  const nextUnit = useMemo(() => {
    if (lessonUnits === null || currentUnitOrder === null) return null;
    return (
      lessonUnits.find((unit) => unit.order === currentUnitOrder + 1) ?? null
    );
  }, [lessonUnits, currentUnitOrder]);

  const handleNextLesson = useCallback(() => {
    if (nextUnit === null) return;
    logger.info("Next lesson unit started", {
      lessonSlug: sessionContext.lessonSlug,
      lessonUnitOrder: nextUnit.order,
    });
    dispatch(
      startLessonSession({
        targetText: nextUnit.content,
        sessionType: SessionTypeValue.LessonUnit,
        lessonSlug: sessionContext.lessonSlug,
        lessonUnitOrder: nextUnit.order,
      }),
    );
  }, [dispatch, nextUnit, sessionContext.lessonSlug]);

  const handleReturnToLessons = useCallback(() => {
    dispatch(navigateHome());
    navigate("/lessons");
  }, [dispatch, navigate]);

  const showDisplay =
    status === "ready" || status === "active" || status === "paused";
  const isCompleted = status === "completed";

  const configSummary = formatConfigSummary(
    isZenMode,
    configDuration,
    configWordCount,
    configMaxErrors,
  );

  const showCountdown =
    configDuration !== null && !isZenMode && !isLessonSession;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Type Test</h1>
      </div>

      {isCompleted && results && (
        <>
          {isLessonSession ? (
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.controlBtn}
                onClick={() => {
                  logger.info("Lesson unit retried", {
                    wpm: results.wpm,
                    accuracy: results.accuracy,
                  });
                  handleReset();
                }}
              >
                Retry
              </button>
              {nextUnit !== null && (
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={handleNextLesson}
                >
                  Next Lesson
                </button>
              )}
              {nextUnitError !== null && (
                <p className={styles.errorHint}>{nextUnitError}</p>
              )}
              <button
                type="button"
                className={styles.controlBtn}
                onClick={() => {
                  logger.info("Returned to lessons", {
                    wpm: results.wpm,
                    accuracy: results.accuracy,
                  });
                  handleReturnToLessons();
                }}
              >
                Return to Lessons
              </button>
            </div>
          ) : (
            <>
              <CollapsibleSection
                title="Test Settings"
                summary={configSummary}
                storageKey={TEST_SETTINGS_STORAGE_KEY}
                defaultOpen={false}
              >
                <TestConfigOptions />
              </CollapsibleSection>
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={() => {
                    logger.info("Test restarted", {
                      wpm: results.wpm,
                      accuracy: results.accuracy,
                    });
                    handleReset();
                  }}
                >
                  Try Again
                </button>
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={() => {
                    logger.info("Test refreshed from results", {
                      wpm: results.wpm,
                      accuracy: results.accuracy,
                    });
                    handleRefresh();
                  }}
                >
                  New Words
                </button>
              </div>
            </>
          )}
        </>
      )}

      {showDisplay && (
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <LiveWpm ready={liveWpmReady} value={liveWpm} />
            <span className={styles.statLabel}>WPM</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{currentAccuracy}%</span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
          {configWordCount !== null && !isLessonSession && (
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {wordsCompleted}/{configWordCount}
              </span>
              <span className={styles.statLabel}>Words</span>
            </div>
          )}
          {configMaxErrors !== null && !isLessonSession && (
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {erroredWords}/{configMaxErrors}
              </span>
              <span className={styles.statLabel}>Errors</span>
            </div>
          )}
          <div className={styles.timer}>
            {showCountdown ? `${timeRemaining ?? 0}s` : `${elapsedTime}s`}
          </div>
        </div>
      )}

      <TypingInput status={status} onKeyDown={handleKeyDown}>
        {showDisplay && <TypingDisplay />}
      </TypingInput>

      {showDisplay && (
        <div className={styles.controls}>
          {status === "active" && (
            <button
              type="button"
              className={styles.controlBtn}
              onClick={handlePause}
            >
              Pause
            </button>
          )}
          {status === "paused" && (
            <button
              type="button"
              className={styles.controlBtn}
              onClick={handleResume}
            >
              Resume
            </button>
          )}
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => {
              logger.info("Test quit early", { wpm: currentWpm });
              handleQuit();
            }}
          >
            Quit
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => {
              logger.info("Test reset", { wpm: currentWpm });
              handleReset();
            }}
          >
            Reset
          </button>
          {!isLessonSession && (
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => {
                logger.info("Test refreshed", { wpm: currentWpm });
                handleRefresh();
              }}
            >
              Refresh
            </button>
          )}
        </div>
      )}

      {isCompleted && results && (
        <ResultsDisplay
          results={results}
          targetText={targetText}
          typedText={typedText}
          currentIndex={currentIndex}
          fixedChars={fixedChars}
          wpmTimeline={wpmTimeline}
        />
      )}
    </div>
  );
}
