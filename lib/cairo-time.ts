/**
 * Calendar days in Egypt, for code end dates.
 *
 * Staff pick "the day the guest leaves" from a date input, which gives a bare
 * YYYY-MM-DD with no zone. The server must not read that in its own zone:
 * Railway runs in UTC, so "30 Sep, end of day" became 02:59 on 1 Oct in Cairo
 * and the panel then showed staff a different day from the one they picked.
 *
 * Egypt observes daylight saving again (+03:00 in summer, +02:00 in winter), so
 * the offset is looked up with Intl for each date rather than hardcoded. Shared
 * by the codes route (server) and the code panel (client), so it imports nothing.
 */

export const CAIRO_TIME_ZONE = 'Africa/Cairo';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CAIRO_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

/** The Cairo wall-clock reading of an instant. */
function cairoParts(date: Date) {
  const parts: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Some engines print midnight as 24 even with h23.
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
    second: parts.second
  };
}

/** Milliseconds Cairo is ahead of UTC at that instant (DST-aware). */
function cairoOffsetMs(date: Date): number {
  const p = cairoParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Whole seconds only: the formatter has no milliseconds.
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** A real calendar day as YYYY-MM-DD, or null. Rejects 2026-02-31 rather than rolling it into March. */
function parseDay(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

/** Today's date in Cairo as YYYY-MM-DD -- the earliest end date a new code can have. */
export function cairoToday(now: Date = new Date()): string {
  const p = cairoParts(now);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * A code's end instant is the end of the stay's last day, so that day is read
 * twelve hours before it. For codes made from now on (23:59:59 Cairo) that is
 * simply the same day. Codes made before this fix end at 23:59:59 UTC, which
 * is 01:59 or 02:59 the next morning in Cairo: read at the instant itself they
 * showed the day after the one staff picked, and "Change end date" prefilled
 * it, so saving untouched added a day to the stay.
 */
const LAST_DAY_LOOKBACK_MS = 12 * 60 * 60 * 1000;

function lastDayInstant(expiresAt: string): Date {
  return new Date(new Date(expiresAt).getTime() - LAST_DAY_LOOKBACK_MS);
}

/** The last day of the stay a code covers, as YYYY-MM-DD in Cairo (for prefilling a date input). */
export function codeLastDay(expiresAt: string): string {
  return cairoToday(lastDayInstant(expiresAt));
}

/**
 * The instant a code picked to end on `day` stops working: 23:59:59 in Cairo on
 * that day. A stay ends when the guest leaves, not at midnight as they wake up.
 * Returns null for anything that is not a real YYYY-MM-DD.
 */
export function endOfCairoDay(day: string): string | null {
  const parsed = parseDay(day);
  if (!parsed) return null;
  const wall = Date.UTC(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59);
  // Two passes: the offset is guessed at the wall time read as UTC, then
  // re-read at the resulting instant, which settles it on DST change days. On
  // the night clocks go back, 23:59:59 happens twice; this lands on the later one.
  let instant = wall - cairoOffsetMs(new Date(wall));
  instant = wall - cairoOffsetMs(new Date(instant));
  return new Date(instant).toISOString();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "30 Sep 2026" as a Cairo calendar day. Built by hand rather than with
 * toLocaleDateString: Node and Safari ship different locale data ("Sept" vs
 * "Sep"), and any difference between the server render and the phone is a
 * hydration mismatch.
 */
function formatCairoDate(date: Date): string {
  const p = cairoParts(date);
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}`;
}

/** A code's last day, e.g. "30 Sep 2026" (see codeLastDay). */
export function formatCodeLastDay(expiresAt: string): string {
  return formatCairoDate(lastDayInstant(expiresAt));
}
