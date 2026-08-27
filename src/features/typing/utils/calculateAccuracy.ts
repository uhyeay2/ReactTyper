export function calculateAccuracy(
  correctChars: number,
  totalChars: number,
): number {
  if (totalChars <= 0) return 0;
  return Math.round((correctChars / totalChars) * 100);
}
