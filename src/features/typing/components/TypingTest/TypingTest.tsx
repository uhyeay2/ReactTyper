import { useAppSelector } from "@/app/hooks";
import {
  selectDuration,
  selectWordCount,
  selectMaxErrors,
  selectIsZenMode,
} from "@/features/typingConfig/state/typingConfigSlice";
import { useTypingTest } from "../../hooks/useTypingTest";
import { TypingDisplay } from "../TypingDisplay/TypingDisplay";
import { TypingInput } from "../TypingInput/TypingInput";
import { LiveWpm } from "../LiveWpm/LiveWpm";
import { ResultsDisplay } from "../ResultsDisplay/ResultsDisplay";
import { TestConfigOptions } from "@/shared/components/TestConfigOptions/TestConfigOptions";
import { logger } from "@/infrastructure/logging/logger";
import styles from "./TypingTest.module.css";

function getSubtitle(
  isZenMode: boolean,
  duration: number | null,
  wordCount: number | null,
  maxErrors: number | null,
): string {
  if (isZenMode) return "Zen Mode \u00b7 No limits";

  const parts: string[] = [];
  if (duration !== null) {
    parts.push(`${duration}s`);
  }
  if (wordCount !== null) {
    parts.push(`${wordCount} words`);
  }
  if (maxErrors !== null) {
    parts.push(`${maxErrors} max errors`);
  }

  return parts.length > 0 ? parts.join(" \u00b7 ") : "Free typing";
}

export function TypingTest() {
  const configDuration = useAppSelector(selectDuration);
  const configWordCount = useAppSelector(selectWordCount);
  const configMaxErrors = useAppSelector(selectMaxErrors);
  const isZenMode = useAppSelector(selectIsZenMode);

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
    results,
    handleKeyDown,
    handlePause,
    handleResume,
    handleQuit,
    handleReset,
    handleRefresh,
  } = useTypingTest();

  const showDisplay =
    status === "ready" || status === "active" || status === "paused";
  const isCompleted = status === "completed";

  const subtitle = getSubtitle(
    isZenMode,
    configDuration,
    configWordCount,
    configMaxErrors,
  );

  const showCountdown = configDuration !== null && !isZenMode;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Type Test</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

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
        </div>
      )}

      {isCompleted && results && (
        <>
          <ResultsDisplay
            results={results}
            targetText={targetText}
            typedText={typedText}
            currentIndex={currentIndex}
            fixedChars={fixedChars}
            wpmTimeline={wpmTimeline}
          />
          <div className={styles.configSection}>
            <h3 className={styles.configTitle}>Test Settings</h3>
            <TestConfigOptions />
          </div>
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
    </div>
  );
}
