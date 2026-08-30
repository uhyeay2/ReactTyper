import { apiFetch } from "@/infrastructure/api/client";
import type { AdminLesson, AdminLessonPayload } from "../state/adminLessonTypes";

interface ListAdminLessonsResponse {
  lessons: AdminLesson[];
}

interface AdminLessonResponse {
  lesson: AdminLesson;
}

export async function apiListAdminLessons(): Promise<AdminLesson[]> {
  const response = await apiFetch<ListAdminLessonsResponse>("/admin/lessons");
  return response.lessons;
}

export async function apiCreateLesson(
  payload: AdminLessonPayload,
): Promise<AdminLesson> {
  const response = await apiFetch<AdminLessonResponse>("/admin/lessons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.lesson;
}

export async function apiUpdateLesson(
  slug: string,
  payload: AdminLessonPayload,
): Promise<AdminLesson> {
  const response = await apiFetch<AdminLessonResponse>(
    `/admin/lessons/${encodeURIComponent(slug)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return response.lesson;
}

export async function apiDeleteLesson(slug: string): Promise<void> {
  await apiFetch<void>(`/admin/lessons/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}
