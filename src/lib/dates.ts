/** YAML `YYYY-MM-DD` is UTC midnight. Keep that calendar day in every timezone. */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
