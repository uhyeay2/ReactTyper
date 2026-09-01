import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import {
  selectDuration,
  selectWordCount,
  selectMaxErrors,
  selectIsZenMode,
  selectWordBankSlug,
} from "@/features/typingConfig/state/typingConfigSlice";
import { formatConfigSummary } from "@/features/typingConfig/utils/formatConfigSummary";
import { TestConfigOptions } from "@/shared/components/TestConfigOptions/TestConfigOptions";
import { useWordDrop } from "../../hooks/useWordDrop";
import { LOSE_STACK_SIZE } from "../../utils/wordDropEngine";
import { WordDropField } from "./WordDropField";
import { WordDropInput } from "./WordDropInput";
import { WordDropResults } from "./WordDropResults";
import styles from "./WordDrop.module.css";

export function WordDrop() {
  const navigate = useNavigate();
  const configDuration = useAppSelector(selectDuration);
  const configWordCount = useAppSelector(selectWordCount);
  const configMaxErrors = useAppSelector(selectMaxErrors);
  const isZenMode = useAppSelector(selectIsZenMode);
  const configWordBankSlug = useAppSelector(selectWordBankSlug);

  const {
    status,
    words,
    nextWord,
    typed,
    metrics,
    elapsed,
    bufferError,
    results,
    liveWpm,
    fallDuration,
    handleStart,
    handleKeyDown,
    handleQuit,
    handleReset,
    handleStackOverflow,
  } = useWordDrop();

  const handleBackToGames = useCallback(() => {
    navigate("/games");
  }, [navigate]);

  const isPlaying = status === "ready" || status === "active";
  const isCompleted = status === "completed";

  const summary = formatConfigSummary(
    isZenMode,
    configDuration,
    configWordCount,
    configMaxErrors,
    configWordBankSlug,
  );

  if (isCompleted && results) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Word Drop</h1>
        </header>
        <WordDropResults
          results={results}
          onPlayAgain={handleStart}
          onEditSettings={handleReset}
          onBackToGames={handleBackToGames}
        />
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Word Drop</h1>
        </header>
        <div className={styles.configSection}>
          <TestConfigOptions />
        </div>
        <button
          type="button"
          className={styles.startBtn}
          onClick={handleStart}
        >
          Start Game
        </button>
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleBackToGames}
        >
          Back to Games
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Word Drop</h1>
        <p className={styles.subtitle}>{summary}</p>
      </header>

      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{metrics.score}</span>
          <span className={styles.statLabel}>Score</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{liveWpm}</span>
          <span className={styles.statLabel}>WPM</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {words.length}/{LOSE_STACK_SIZE}
          </span>
          <span className={styles.statLabel}>Stack</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{elapsed}s</span>
          <span className={styles.statLabel}>Time</span>
        </div>
      </div>

      {nextWord ? (
        <div className={styles.nextWordPreview} aria-live="polite">
          <span className={styles.nextWordLabel}>Next</span>
          <span className={styles.nextWordText}>{nextWord}</span>
        </div>
      ) : null}

      <WordDropInput active={status === "active"} onKeyDown={handleKeyDown}>
        <WordDropField
          words={words}
          typed={typed}
          fallDuration={fallDuration}
          active={status === "active"}
          onStackOverflow={handleStackOverflow}
        />
      </WordDropInput>

      {bufferError ? (
        <p className={styles.errorHint}>Missed a key - keep typing the word</p>
      ) : null}

      <div className={styles.controls}>
        {status === "active" && (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleQuit}
          >
            End Game
          </button>
        )}
      </div>
    </div>
  );
}
