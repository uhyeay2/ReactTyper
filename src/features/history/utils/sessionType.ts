import { SessionTypeValue, type SessionType } from "../state/historyTypes";

const LABELS: Record<SessionType, string> = {
  [SessionTypeValue.TypingTest]: "Typing Test",
  [SessionTypeValue.Lesson]: "Lesson",
  [SessionTypeValue.LessonUnit]: "Lesson Unit",
};

export function sessionTypeLabel(sessionType: SessionType): string {
  return LABELS[sessionType] ?? "Typing Test";
}

export function isLessonSessionType(sessionType: number): boolean {
  return (
    sessionType === SessionTypeValue.Lesson ||
    sessionType === SessionTypeValue.LessonUnit
  );
}
