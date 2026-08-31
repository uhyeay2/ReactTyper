import { formatConfigSummary } from "@/features/typingConfig/utils/formatConfigSummary";
import {
  SessionTypeValue,
  type TypingTestResult,
} from "../state/historyTypes";

const SEGMENT_SEPARATOR = " \u00b7 ";

export interface SessionContextDescription {
  summary: string;
  detail?: string;
}

function describeLessonContext(result: TypingTestResult): SessionContextDescription {
  const parts: string[] = [];
  const lessonName = result.lessonTitle ?? result.lessonSlug;
  if (lessonName !== null) {
    parts.push(`Lesson ${lessonName}`);
  }
  if (result.lessonUnitOrder !== null) {
    const unitLabel = result.lessonUnitTitle !== null
      ? `Unit ${result.lessonUnitOrder + 1}: ${result.lessonUnitTitle}`
      : `Unit ${result.lessonUnitOrder + 1}`;
    parts.push(unitLabel);
  }
  const summary = parts.join(SEGMENT_SEPARATOR);
  return { summary: summary !== "" ? summary : result.sessionType === SessionTypeValue.LessonUnit ? "Lesson Unit" : "Lesson" };
}

/**
 * Produces a human-readable description of the session context for a saved
 * result. Typing tests describe the settings that were used (time limit, word
 * limit, max errors, or Zen Mode); lesson sessions describe the lesson and
 * unit that were completed.
 */
export function describeSessionContext(
  result: TypingTestResult,
): SessionContextDescription {
  if (result.sessionType === SessionTypeValue.TypingTest) {
    return {
      summary: formatConfigSummary(
        result.isZenMode,
        result.durationLimitSeconds,
        result.maxWords,
        result.maxErrors,
      ),
    };
  }

  return describeLessonContext(result);
}
