import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  apiDeleteLesson,
  apiListAdminLessons,
} from "../../services/adminLessonsApi";
import type { AdminLesson } from "../../state/adminLessonTypes";
import styles from "./AdminLessonsScreen.module.css";

export function AdminLessonsScreen() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiListAdminLessons()
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
  }, [reload]);

  const handleDelete = useCallback(
    async (slug: string) => {
      const confirmed = window.confirm(
        `Delete lesson "${slug}"? This cannot be undone.`,
      );
      if (!confirmed) return;
      setError(null);
      try {
        await apiDeleteLesson(slug);
        setReload((count) => count + 1);
      } catch {
        setError("Unable to delete the lesson.");
      }
    },
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Manage Lessons</h1>
        <Link className={styles.newLink} to="/admin/lessons/new">
          New lesson
        </Link>
      </div>
      {loading ? <p className={styles.muted}>Loading...</p> : null}
      {error !== null ? <p className={styles.error}>{error}</p> : null}
      {!loading && error === null && lessons.length === 0 ? (
        <p className={styles.muted}>No lessons yet.</p>
      ) : null}
      <ul className={styles.list}>
        {lessons.map((lesson) => (
          <li key={lesson.slug} className={styles.item}>
            <div className={styles.info}>
              <span className={styles.title}>{lesson.title}</span>
              <span className={styles.meta}>
                {lesson.isActive ? "Active" : "Inactive"} &middot;{" "}
                {lesson.units.length} unit{lesson.units.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => navigate(`/admin/lessons/${lesson.slug}`)}
              >
                Edit
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => void handleDelete(lesson.slug)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
