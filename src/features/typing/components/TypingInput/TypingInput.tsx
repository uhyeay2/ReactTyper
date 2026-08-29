import { useEffect, useRef } from "react";
import type { TestStatus } from "../../state/typingTypes";
import styles from "./TypingInput.module.css";

interface TypingInputProps {
  status: TestStatus;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

export function TypingInput({ status, onKeyDown, children }: TypingInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const handleClick = () => {
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
      {status === "ready" && (
        <span className={styles.focusPrompt}>
          Press any key to start
        </span>
      )}
    </div>
  );
}
