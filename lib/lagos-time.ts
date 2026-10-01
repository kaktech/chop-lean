// Africa/Lagos is UTC+1 all year (no daylight saving), so plain offset maths is exact.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Delivery days: Mon=1, Wed=3, Fri=5 (JS getUTCDay numbering). */
const DELIVERY_DOWS = [1, 3, 5];

export type LagosDate = { y: number; m: number; d: number };

/** A Date shifted so its UTC fields read as Lagos wall-clock time. */
const toLagosWall = (instant: Date) => new Date(instant.getTime() + LAGOS_OFFSET_MS);

/** Instant for 18:00 Lagos on a calendar day. */
function lagosSixPm({ y, m, d }: LagosDate): Date {
  return new Date(Date.UTC(y, m - 1, d, 18, 0, 0) - LAGOS_OFFSET_MS);
}

const fromWall = (w: Date): LagosDate => ({
  y: w.getUTCFullYear(),
  m: w.getUTCMonth() + 1,
  d: w.getUTCDate(),
});

/** Order cutoff for a delivery day: 6pm Lagos the day before. */
export function orderCutoffFor(delivery: LagosDate): Date {
  const prev = new Date(Date.UTC(delivery.y, delivery.m - 1, delivery.d) - DAY_MS);
  return lagosSixPm(fromWall(prev));
}

/** Next `count` delivery days (Mon/Wed/Fri) that can still be ordered at `now`. */
export function nextDeliveryDates(now: Date = new Date(), count = 3): LagosDate[] {
  const out: LagosDate[] = [];
  let cursor = toLagosWall(now);
  cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));
  for (let i = 0; i < 60 && out.length < count; i++) {
    cursor = new Date(cursor.getTime() + DAY_MS);
    if (!DELIVERY_DOWS.includes(cursor.getUTCDay())) continue;
    const date = fromWall(cursor);
    if (now.getTime() < orderCutoffFor(date).getTime()) out.push(date);
  }
  return out;
}

export const isDeliveryDay = (date: LagosDate) =>
  DELIVERY_DOWS.includes(new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay());

export function canOrderFor(date: LagosDate, now: Date = new Date()): boolean {
  return isDeliveryDay(date) && now.getTime() < orderCutoffFor(date).getTime();
}

/** Pause/skip cutoff: Thursday 6pm Lagos before the week being changed. */
export function isPastPauseCutoff(now: Date = new Date()): boolean {
  const w = toLagosWall(now);
  const dow = w.getUTCDay(); // 4 = Thu
  const mins = w.getUTCHours() * 60 + w.getUTCMinutes();
  if (dow === 4) return mins >= 18 * 60;
  return dow === 5 || dow === 6 || dow === 0;
}

export const toISODate = ({ y, m, d }: LagosDate) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function describeDate({ y, m, d }: LagosDate) {
  const dow = DOWS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { dow, day: d, month: MONTHS[m - 1], short: `${dow}, ${d} ${MONTHS[m - 1].slice(0, 3)}` };
}

/** Monday (as ISO date) of the next delivery week, i.e. the week a "pause next week" action affects. */
export function nextWeekMonday(now: Date = new Date()): string {
  const w = toLagosWall(now);
  const dow = w.getUTCDay() || 7; // Mon=1..Sun=7
  const monday = new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()) + (8 - dow) * DAY_MS);
  return toISODate(fromWall(monday));
}
