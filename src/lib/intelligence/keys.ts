// Period-key generators — MUST match the format used by the Electron agent
// when writing aggregate docs. UTC-based.

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDayKey(d: Date): string {
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
}

export function formatMonthKey(d: Date): string {
  return `${d.getUTCFullYear()}_${pad2(d.getUTCMonth() + 1)}`;
}

export function getISOWeek(d: Date): { isoYear: number; isoWeek: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const fdn = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fdn + 3);
  const week =
    1 +
    Math.round(
      (date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000)
    );
  return { isoYear: date.getUTCFullYear(), isoWeek: week };
}

export function formatWeekKey(d: Date): string {
  const { isoYear, isoWeek } = getISOWeek(d);
  return `${isoYear}_W${pad2(isoWeek)}`;
}

export function dailyDocId(userId: string, d: Date): string {
  return `${userId}_${formatDayKey(d)}`;
}

export function weeklyDocId(userId: string, d: Date): string {
  return `${userId}_${formatWeekKey(d)}`;
}

export function monthlyDocId(userId: string, d: Date): string {
  return `${userId}_${formatMonthKey(d)}`;
}

// Pretty-print "20260509" → "2026-05-09"
export function prettyDayKey(dayKey: string): string {
  if (dayKey?.length !== 8) return dayKey;
  return `${dayKey.slice(0, 4)}-${dayKey.slice(4, 6)}-${dayKey.slice(6, 8)}`;
}
