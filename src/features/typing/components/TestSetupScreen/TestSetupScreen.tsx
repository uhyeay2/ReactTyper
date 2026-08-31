import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { startFromHome } from "@/features/typing/state/typingSlice";
import {
  selectWordCount,
  selectWordBankSlug,
} from "@/features/typingConfig/state/typingConfigSlice";
import { TestConfigOptions } from "@/shared/components/TestConfigOptions/TestConfigOptions";
import styles from "./TestSetupScreen.module.css";

const DEFAULT_WORD_COUNT = 50;

export function TestSetupScreen() {
  const dispatch = useAppDispatch();
  const configWordCount = useAppSelector(selectWordCount);
  const configWordBankSlug = useAppSelector(selectWordBankSlug);

  const handleStart = useCallback(() => {
    dispatch(
      startFromHome({
        wordCount: configWordCount ?? DEFAULT_WORD_COUNT,
        wordBankSlug: configWordBankSlug,
      }),
    );
  }, [dispatch, configWordCount, configWordBankSlug]);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>ReactTyper</h1>
        <p className={styles.subtitle}>
          Test your typing speed and accuracy
        </p>
      </div>

      <div className={styles.configSection}>
        <TestConfigOptions />
      </div>

      <button
        type="button"
        className={styles.startBtn}
        onClick={handleStart}
      >
        Start Typing
      </button>
    </div>
  );
}
