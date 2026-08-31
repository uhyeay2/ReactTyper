/**
 * Produces a human-readable label from a word bank slug, e.g.
 * "english-top-200" -> "English Top 200". Unknown slugs still yield a
 * readable label derived from the slug itself.
 */
export function formatWordBankLabel(slug: string): string {
  return slug
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}
