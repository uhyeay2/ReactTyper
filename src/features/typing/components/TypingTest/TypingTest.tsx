import { useAppSelector } from "@/app/hooks";
import {
  selectDuration,
  selectWordCount,
  selectMaxErrors,
  selectIsZenMode,
} from "@/features/typingConfig/state/typingConfigSlice";
import { formatConfigSummary } from "@/features/typingConfig/utils/formatConfigSummary";
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

  const showDisplay =
    status === "ready" || status === "active" || status === "paused";
  const isCompleted = status === "completed";

  const configSummary = formatConfigSummary(
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
      </div>

      {isCompleted && results && (
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
          {configWordCount !== null && (
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {wordsCompleted}/{configWordCount}
              </span>
              <span className={styles.statLabel}>Words</span>
            </div>
          )}
          {configMaxErrors !== null && (
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
