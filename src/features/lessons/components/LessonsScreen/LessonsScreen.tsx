import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/app/hooks";
import { startLessonSession } from "@/features/typing/state/typingSlice";
import { SessionTypeValue } from "@/features/history/state/historyTypes";
import { apiGetLesson, apiListLessons } from "../../services/lessonsApi";
import type { LessonDetail, LessonSummary, LessonUnit } from "../../state/lessonTypes";
import styles from "./LessonsScreen.module.css";

interface ExpandedLesson {
  lesson: LessonDetail | null;
  loading: boolean;
  error: boolean;
}

export function LessonsScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, ExpandedLesson>>({});

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

  const toggleLesson = useCallback((slug: string) => {
    setExpanded((current) => {
      const isOpen = current[slug] !== undefined;
      if (isOpen) {
        const next = { ...current };
        delete next[slug];
        return next;
      }
      return { ...current, [slug]: { lesson: null, loading: true, error: false } };
    });
  }, []);

  const loadUnits = useCallback((slug: string) => {
    setExpanded((current) => {
      const existing = current[slug];
      if (existing && existing.lesson !== null) return current;
      void apiGetLesson(slug)
        .then((data) => {
          setExpanded((inner) => {
            const entry = inner[slug];
            if (!entry) return inner;
            return { ...inner, [slug]: { lesson: data, loading: false, error: false } };
          });
        })
        .catch(() => {
          setExpanded((inner) => {
            const entry = inner[slug];
            if (!entry) return inner;
            return { ...inner, [slug]: { ...entry, loading: false, error: true } };
          });
        });
      return current;
    });
  }, []);

  const handleStart = useCallback(
    (unit: LessonUnit, slug: string) => {
      dispatch(
        startLessonSession({
          targetText: unit.content,
          sessionType: SessionTypeValue.LessonUnit,
          lessonSlug: slug,
          lessonUnitOrder: unit.order,
        }),
      );
      navigate("/");
    },
    [dispatch, navigate],
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Lessons</h1>
      {loading ? <p className={styles.muted}>Loading...</p> : null}
      {error !== null ? <p className={styles.error}>{error}</p> : null}
      {!loading && error === null && lessons.length === 0 ? (
        <p className={styles.muted}>No lessons available yet.</p>
      ) : null}
      <ul className={styles.list}>
        {lessons.map((lesson) => {
          const entry = expanded[lesson.slug];
          const isOpen = entry !== undefined;
          return (
            <li key={lesson.slug} className={styles.item}>
              <button
                type="button"
                className={styles.header}
                onClick={() => {
                  toggleLesson(lesson.slug);
                  if (!isOpen) loadUnits(lesson.slug);
                }}
                aria-expanded={isOpen}
              >
                <span className={styles.headerTitle}>
                  <span className={styles.title}>{lesson.title}</span>
                  <span className={styles.meta}>
                    Difficulty {lesson.difficultyLevel} &middot;{" "}
                    {lesson.unitCount} unit{lesson.unitCount === 1 ? "" : "s"}
                  </span>
                </span>
                <span className={styles.chevron} aria-hidden="true">
                  {isOpen ? "\u25BC" : "\u25B6"}
                </span>
              </button>
              {isOpen && (
                <div className={styles.body}>
                  <p className={styles.description}>{lesson.description}</p>
                  {entry.loading ? (
                    <p className={styles.muted}>Loading units...</p>
                  ) : entry.error || entry.lesson === null ? (
                    <p className={styles.error}>Unable to load this lesson.</p>
                  ) : (
                    <LessonUnits
                      lesson={entry.lesson}
                      onStart={(unit) => handleStart(unit, lesson.slug)}
                    />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface LessonUnitsProps {
  lesson: LessonDetail;
  onStart: (unit: LessonUnit) => void;
}

function LessonUnits({ lesson, onStart }: LessonUnitsProps) {
  return (
    <ul className={styles.unitList}>
      {lesson.units.map((unit) => (
        <li key={unit.order} className={styles.unitItem}>
          <div className={styles.unitInfo}>
            <span className={styles.unitTitle}>{unit.title}</span>
            <span className={styles.unitMeta}>
              Unit {unit.order + 1} of {lesson.units.length}
            </span>
          </div>
          <button
            type="button"
            className={styles.start}
            onClick={() => onStart(unit)}
          >
            Start
          </button>
        </li>
      ))}
    </ul>
  );
}
