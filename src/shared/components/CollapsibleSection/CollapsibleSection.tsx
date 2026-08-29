import { useId, type ReactNode } from "react";
import { usePersistedBoolean } from "@/shared/hooks/usePersistedBoolean";
import styles from "./CollapsibleSection.module.css";

interface CollapsibleSectionProps {
  title: string;
  summary?: string;
  storageKey: string;
  defaultOpen: boolean;
  children: ReactNode;
}

/**
 * A disclosure-style section whose open/closed state is persisted in
 * localStorage under `storageKey`. The header renders the title plus an
 * optional right-aligned summary of the section's current content.
 */
export function CollapsibleSection({
  title,
  summary,
  storageKey,
  defaultOpen,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = usePersistedBoolean(storageKey, defaultOpen);
  const contentId = useId();

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={
            isOpen
              ? `${styles.chevron} ${styles.chevronOpen}`
              : styles.chevron
          }
          aria-hidden="true"
        >
          ▸
        </span>
        <span className={styles.title}>{title}</span>
        {summary && <span className={styles.summary}>{summary}</span>}
      </button>
      {isOpen && (
        <div id={contentId} className={styles.content}>
          {children}
        </div>
      )}
    </section>
  );
}