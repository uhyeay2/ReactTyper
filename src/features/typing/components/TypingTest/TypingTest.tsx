import { useTypingTest } from "../../hooks/useTypingTest";
import { TypingDisplay } from "../TypingDisplay/TypingDisplay";
import { TypingInput } from "../TypingInput/TypingInput";
import { ResultsDisplay } from "../ResultsDisplay/ResultsDisplay";
import { logger } from "@/infrastructure/logging/logger";
import styles from "./TypingTest.module.css";

export function TypingTest() {
  const {
    status,
    currentWpm,
    currentAccuracy,
    timeRemaining,
    results,
    handleStart,
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Type Test</h1>
        <p className={styles.subtitle}>
          60 seconds &middot; Test your typing speed
        </p>
      </div>

      {showDisplay && (
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{currentWpm}</span>
            <span className={styles.statLabel}>WPM</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{currentAccuracy}%</span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
          <div className={styles.timer}>{timeRemaining}s</div>
        </div>
      )}

      <TypingInput status={status} onKeyDown={handleKeyDown} onClickStart={handleStart}>
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
          <ResultsDisplay results={results} />
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
