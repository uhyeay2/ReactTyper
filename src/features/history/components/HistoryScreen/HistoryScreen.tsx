import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  loadHistory,
  selectHistoryError,
  selectHistoryLoading,
  selectHistoryResults,
} from "../../state/historySlice";
import { sessionTypeLabel } from "../../utils/sessionType";
import { describeSessionContext } from "../../utils/describeSessionContext";
import { HistoryDetail } from "../HistoryDetail/HistoryDetail";
import type { TypingTestResult } from "../../state/historyTypes";
import styles from "./HistoryScreen.module.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function HistoryScreen() {
  const dispatch = useAppDispatch();
  const results = useAppSelector(selectHistoryResults);
  const loading = useAppSelector(selectHistoryLoading);
  const error = useAppSelector(selectHistoryError);
  const [selected, setSelected] = useState<TypingTestResult | null>(null);

  const load = useCallback(() => {
    void dispatch(loadHistory());
  }, [dispatch]);

  useEffect(load, [load]);

  if (selected !== null) {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>History</h1>
        <HistoryDetail
          result={selected}
          onBack={() => setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>History</h1>
      {loading ? <p className={styles.muted}>Loading...</p> : null}
      {error !== null ? <p className={styles.error}>{error}</p> : null}
      {!loading && error === null && results.length === 0 ? (
        <p className={styles.muted}>No results yet. Complete a test to see it here.</p>
      ) : null}
      <ul className={styles.list}>
        {results.map((result) => (
          <li key={result.publicId} className={styles.item}>
            <div>
              <span className={styles.wpm}>{result.wpm} WPM</span>
              <span className={styles.accuracy}>
                {Math.round(result.accuracy)}% accuracy
              </span>
            </div>
            <div className={styles.row}>
              <span className={styles.badge}>{sessionTypeLabel(result.sessionType)}</span>
              <span className={styles.meta}>{formatDate(result.completedAtUtc)}</span>
            </div>
            <span className={styles.context}>
              {describeSessionContext(result).summary}
            </span>
            <button
              type="button"
              className={styles.detailButton}
              onClick={() => setSelected(result)}
            >
              View details
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
