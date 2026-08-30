export interface LessonSummary {
  slug: string;
  title: string;
  description: string;
  difficultyLevel: number;
  unitCount: number;
}

export interface LessonUnit {
  order: number;
  title: string;
  content: string;
}

export interface LessonDetail {
  slug: string;
  title: string;
  description: string;
  difficultyLevel: number;
  units: LessonUnit[];
}
