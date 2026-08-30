import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "@/app/hooks";
import { startLessonSession } from "@/features/typing/state/typingSlice";
import { SessionTypeValue } from "@/features/history/state/historyTypes";
import { apiGetLesson } from "../../services/lessonsApi";
import type { LessonDetail, LessonUnit } from "../../state/lessonTypes";
import styles from "./LessonDetailScreen.module.css";

export function LessonDetailScreen() {
  const { slug = "" } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetLesson(slug)
      .then((data) => {
        if (cancelled) return;
        setError(null);
        setLesson(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Unable to load this lesson.");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleStart = useCallback(
    (unit: LessonUnit) => {
      dispatch(
        startLessonSession({
          targetText: unit.content,
          sessionType: SessionTypeValue.LessonUnit,
          lessonSlug: lesson?.slug ?? slug,
          lessonUnitOrder: unit.order,
        }),
      );
      navigate("/");
    },
    [dispatch, navigate, lesson?.slug, slug],
  );

  if (error !== null) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
        <Link className={styles.back} to="/lessons">
          Back to lessons
        </Link>
      </div>
    );
  }

  if (lesson === null) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Link className={styles.back} to="/lessons">
        &larr; All lessons
      </Link>
      <h1 className={styles.heading}>{lesson.title}</h1>
      <p className={styles.subtitle}>{lesson.description}</p>
      <ul className={styles.list}>
        {lesson.units.map((unit) => (
          <li key={unit.order} className={styles.item}>
            <div className={styles.unitInfo}>
              <span className={styles.unitTitle}>{unit.title}</span>
              <span className={styles.unitMeta}>
                Unit {unit.order + 1} of {lesson.units.length}
              </span>
            </div>
            <button
              type="button"
              className={styles.start}
              onClick={() => handleStart(unit)}
            >
              Start
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
