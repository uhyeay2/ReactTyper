export interface AdminLessonUnit {
  order: number;
  title: string;
  content: string;
}

export interface AdminLesson {
  slug: string;
  title: string;
  description: string;
  difficultyLevel: number;
  isActive: boolean;
  units: AdminLessonUnit[];
}

export interface LessonUnitInput {
  order: number;
  title: string;
  content: string;
  wordBankSlug: string | null;
}

export interface AdminLessonPayload {
  slug: string;
  title: string;
  description: string;
  difficultyLevel: number;
  isActive: boolean;
  units: LessonUnitInput[];
}
