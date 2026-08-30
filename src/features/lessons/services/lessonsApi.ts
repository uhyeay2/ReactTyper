import { apiFetch } from "@/infrastructure/api/client";
import type { LessonDetail, LessonSummary } from "../state/lessonTypes";

interface ListLessonsResponse {
  lessons: LessonSummary[];
}

interface GetLessonResponse {
  slug: string;
  title: string;
  description: string;
  difficultyLevel: number;
  units: LessonUnitResponse[];
}

interface LessonUnitResponse {
  order: number;
  title: string;
  content: string;
}

export async function apiListLessons(): Promise<LessonSummary[]> {
  const response = await apiFetch<ListLessonsResponse>("/lessons");
  return response.lessons;
}

export async function apiGetLesson(slug: string): Promise<LessonDetail> {
  const response = await apiFetch<GetLessonResponse>(`/lessons/${encodeURIComponent(slug)}`);
  return {
    slug: response.slug,
    title: response.title,
    description: response.description,
    difficultyLevel: response.difficultyLevel,
    units: response.units,
  };
}
