/**
 * Returns the date of the Monday of the week containing the given date.
 * Result is formatted as YYYY-MM-DD.
 */
export function getWeekStart(date: Date = new Date()): string {
  // Use UTC throughout to avoid timezone off-by-one issues
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Returns today's day index in the current week: 0 = Monday … 6 = Sunday (UTC). */
export function getTodayIndex(): number {
  return (new Date().getUTCDay() + 6) % 7;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? DAY_NAMES[0]!;
}
