const JOIN_SEPARATOR = " \u00b7 ";

function formatTimeLimit(seconds: number): string {
  if (seconds <= 0) return "0s Time Limit";
  if (seconds < 60) return `${seconds}s Time Limit`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m Time Limit`;
  return `${minutes}m ${remainingSeconds}s Time Limit`;
}

/**
 * Builds a human-readable summary of the selected test settings, e.g.
 * "1m Time Limit", "50 Word Limit · 3 Max Errors", or "Zen Mode".
 */
export function formatConfigSummary(
  isZenMode: boolean,
  duration: number | null,
  wordCount: number | null,
  maxErrors: number | null,
): string {
  if (isZenMode) return "Zen Mode";

  const parts: string[] = [];
  if (duration !== null) parts.push(formatTimeLimit(duration));
  if (wordCount !== null) parts.push(`${wordCount} Word Limit`);
  if (maxErrors !== null) parts.push(`${maxErrors} Max Errors`);

  return parts.length > 0 ? parts.join(JOIN_SEPARATOR) : "No limits";
}