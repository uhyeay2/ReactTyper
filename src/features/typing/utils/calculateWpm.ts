const CHARS_PER_WORD = 5;

export function calculateGrossWpm(
  charactersTyped: number,
  elapsedMinutes: number,
): number {
  if (elapsedMinutes <= 0 || charactersTyped <= 0) return 0;
  return Math.floor(charactersTyped / CHARS_PER_WORD / elapsedMinutes);
}

export function calculateNetWpm(
  grossWpm: number,
  errors: number,
  elapsedMinutes: number,
): number {
  if (elapsedMinutes <= 0) return 0;
  return Math.max(0, Math.floor(grossWpm - errors / elapsedMinutes));
}
