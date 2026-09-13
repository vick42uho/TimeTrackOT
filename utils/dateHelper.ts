/**
 * TimeTrack OT - Timezone-Safe Local Date Utilities
 * 
 * In JavaScript, `new Date().toISOString()` returns time in UTC (GMT+0).
 * In Thailand (UTC+7), between 00:00:00 and 06:59:59 AM, UTC is still in the previous day.
 * Calling `.toISOString().split('T')[0]` causes a 1-day lag until exactly 07:00:00 AM.
 * 
 * These helper functions use local device methods (getFullYear, getMonth, getDate)
 * to guarantee 100% accurate local dates 24 hours a day across midnight and early morning.
 */

/**
 * Returns a 'YYYY-MM-DD' date string formatted in the device's local timezone.
 * Defaults to current local date if not specified.
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object at 00:00:00 local time.
 * Avoids ECMAScript's UTC interpretation of 'YYYY-MM-DD' strings when passed to `new Date()`.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  return new Date(dateStr);
}

/**
 * Generates an array of 'YYYY-MM-DD' date strings between start and end date (inclusive)
 * safely in local time.
 */
export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const cur = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);

  while (cur <= end) {
    dates.push(toLocalDateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}
