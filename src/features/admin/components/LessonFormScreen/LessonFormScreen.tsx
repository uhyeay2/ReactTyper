import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  apiCreateLesson,
  apiListAdminLessons,
  apiUpdateLesson,
} from "../../services/adminLessonsApi";
import type {
  AdminLesson,
  AdminLessonPayload,
  LessonUnitInput,
} from "../../state/adminLessonTypes";
import styles from "./LessonFormScreen.module.css";

interface UnitRow {
  order: number;
  title: string;
  content: string;
  wordBankSlug: string;
}

function emptyUnit(order: number): UnitRow {
  return { order, title: "", content: "", wordBankSlug: "" };
}

export function LessonFormScreen() {
  const { slug = "" } = useParams();
  const editing = slug !== "new";
  const navigate = useNavigate();

  const [formSlug, setFormSlug] = useState(editing ? slug : "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [units, setUnits] = useState<UnitRow[]>(() => [emptyUnit(0)]);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    apiListAdminLessons()
      .then((lessons) => {
        if (cancelled) return;
        setLoadError(null);
        const lesson = lessons.find((item) => item.slug === slug);
        if (lesson === undefined) {
          setLoadError("Lesson not found.");
          return;
        }
        setTitle(lesson.title);
        setDescription(lesson.description);
        setDifficultyLevel(lesson.difficultyLevel);
        setIsActive(lesson.isActive);
        setUnits(lesson.units.map((unit) => toRow(unit)));
      })
      .catch(() => {
        if (!cancelled) setLoadError("Unable to load lesson.");
      });
    return () => {
      cancelled = true;
    };
  }, [editing, slug]);

  const updateUnit = useCallback((order: number, patch: Partial<UnitRow>) => {
    setUnits((prev) =>
      prev.map((unit) => (unit.order === order ? { ...unit, ...patch } : unit)),
    );
  }, []);

  const addUnit = useCallback(() => {
    setUnits((prev) => [...prev, emptyUnit(prev.length)]);
  }, []);

  const removeUnit = useCallback((order: number) => {
    setUnits((prev) => prev.filter((unit) => unit.order !== order));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      const payload: AdminLessonPayload = {
        slug: formSlug.trim(),
        title: title.trim(),
        description: description.trim(),
        difficultyLevel,
        isActive,
        units: units
          .map<LessonUnitInput>((unit) => ({
            order: unit.order,
            title: unit.title.trim(),
            content: unit.content.trim(),
            wordBankSlug: unit.wordBankSlug || null,
          }))
          .filter((unit) => unit.title.length > 0 || unit.content.length > 0),
      };
      try {
        if (editing) {
          await apiUpdateLesson(slug, payload);
        } else {
          await apiCreateLesson(payload);
        }
        navigate("/admin/lessons");
      } catch {
        setError(
          editing
            ? "Unable to save the lesson."
            : "Unable to create the lesson.",
        );
      }
    },
    [
      editing,
      slug,
      formSlug,
      title,
      description,
      difficultyLevel,
      isActive,
      units,
      navigate,
    ],
  );

  if (loadError !== null) {
    return <p className={styles.error}>{loadError}</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{editing ? "Edit lesson" : "New lesson"}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>Slug</span>
            <input
              className={styles.input}
              value={formSlug}
              onChange={(event) => setFormSlug(event.target.value)}
              disabled={editing}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Difficulty (1-5)</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={5}
              value={difficultyLevel}
              onChange={(event) => setDifficultyLevel(Number(event.target.value))}
            />
          </label>
        </div>
        <label className={styles.field}>
          <span>Title</span>
          <input
            className={styles.input}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span>Description</span>
          <textarea
            className={styles.input}
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>Active</span>
        </label>

        <div className={styles.unitsHeader}>
          <h2 className={styles.subheading}>Units</h2>
          <button type="button" className={styles.addBtn} onClick={addUnit}>
            + Add unit
          </button>
        </div>

        {units.map((unit) => (
          <div key={unit.order} className={styles.unit}>
            <div className={styles.unitRow}>
              <span className={styles.unitBadge}>#{unit.order + 1}</span>
              <input
                className={styles.input}
                placeholder="Unit title"
                value={unit.title}
                onChange={(event) =>
                  updateUnit(unit.order, { title: event.target.value })
                }
              />
              <input
                className={styles.input}
                placeholder="Word bank slug"
                value={unit.wordBankSlug}
                onChange={(event) =>
                  updateUnit(unit.order, { wordBankSlug: event.target.value })
                }
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeUnit(unit.order)}
                aria-label={`Remove unit ${unit.order + 1}`}
              >
                Remove
              </button>
            </div>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="Lesson unit content"
              value={unit.content}
              onChange={(event) =>
                updateUnit(unit.order, { content: event.target.value })
              }
            />
          </div>
        ))}

        {error !== null ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate("/admin/lessons")}>
            Cancel
          </button>
          <button type="submit" className={styles.submit}>
            {editing ? "Save changes" : "Create lesson"}
          </button>
        </div>
      </form>
    </div>
  );
}

function toRow(unit: AdminLesson["units"][number]): UnitRow {
  return {
    order: unit.order,
    title: unit.title,
    content: unit.content,
    wordBankSlug: "",
  };
}
