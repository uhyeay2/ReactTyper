import { useEffect, useRef } from "react";
import styles from "./WordDropInput.module.css";

export interface WordDropInputProps {
  active: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

export function WordDropInput({ active, onKeyDown, children }: WordDropInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) {
      inputRef.current?.focus();
    }
  }, [active]);

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
        aria-label="Word Drop typing input"
      />
      {children}
    </div>
  );
}
