import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiListLessons } from "../../services/lessonsApi";
import type { LessonSummary } from "../../state/lessonTypes";
import styles from "./LessonsScreen.module.css";

export function LessonsScreen() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiListLessons()
      .then((data) => {
        if (cancelled) return;
        setLessons(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Unable to load lessons.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Lessons</h1>
      {loading ? <p className={styles.muted}>Loading...</p> : null}
      {error !== null ? <p className={styles.error}>{error}</p> : null}
      {!loading && error === null && lessons.length === 0 ? (
        <p className={styles.muted}>No lessons available yet.</p>
      ) : null}
      <ul className={styles.list}>
        {lessons.map((lesson) => (
          <li key={lesson.slug} className={styles.item}>
            <Link className={styles.link} to={`/lessons/${lesson.slug}`}>
              <span className={styles.title}>{lesson.title}</span>
              <span className={styles.meta}>
                Difficulty {lesson.difficultyLevel} &middot;{" "}
                {lesson.unitCount} unit{lesson.unitCount === 1 ? "" : "s"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
