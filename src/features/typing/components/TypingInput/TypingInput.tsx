import { useEffect, useRef } from "react";
import type { TestStatus } from "../../state/typingTypes";
import styles from "./TypingInput.module.css";

interface TypingInputProps {
  status: TestStatus;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClickStart?: () => void;
  children?: React.ReactNode;
}

export function TypingInput({ status, onKeyDown, onClickStart, children }: TypingInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const handleClick = () => {
    if (status === "idle" && onClickStart) {
      onClickStart();
    }
    inputRef.current?.focus();
  };

  return (
    <div className={styles.focusArea} onClick={handleClick}>
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="text"
        autoFocus
        onKeyDown={onKeyDown}
        aria-label="Typing input"
      />
      {children}
      {status === "idle" && (
        <span className={styles.focusPrompt}>
          Click here or start typing to begin
        </span>
      )}
      {status === "ready" && (
        <span className={styles.focusPrompt}>
          Press any key to start
        </span>
      )}
    </div>
  );
}
