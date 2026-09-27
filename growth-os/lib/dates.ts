// Date helpers. Plan dates are ISO strings (YYYY-MM-DD) in Europe/Sarajevo.

export const TZ = "Europe/Sarajevo";
export const PLAN_START = "2026-09-28";
export const PLAN_END = "2026-12-31";

export function isoInTz(d: Date = new Date(), tz = TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

export function weekday(iso: string): number {
  return (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7; // Mon=0
}

export function mondayOf(iso: string): string {
  return addDays(iso, -weekday(iso));
}

const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Deterministic date label (no Intl): identical on the server and in every
 * browser, so hydration never disagrees. Options mirror Intl's shape.
 */
export function fmt(iso: string | null | undefined, opts: { weekday?: "short" | "long"; day?: "numeric"; month?: "short" | "long"; year?: "numeric" } = { weekday: "short", day: "numeric", month: "short" }): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const parts: string[] = [];
  if (opts.weekday) parts.push(opts.weekday === "long" ? WD[wd] : WD[wd].slice(0, 3));
  if (opts.day) parts.push(String(d));
  if (opts.month) parts.push(opts.month === "long" ? MO[m - 1] : MO[m - 1].slice(0, 3));
  if (opts.year) parts.push(String(y));
  return parts.join(" ");
}

export function isoWeek(iso: string): number {
  const d = new Date(`${iso}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
}

/** The day the plan should open on: a valid override, else today, clamped into the plan. */
export function resolvePlanDate(override: string | undefined | null, now: Date = new Date()): { date: string; real: string; clamped: "before" | "after" | null; overridden: boolean } {
  const real = isoInTz(now);
  const valid = override && /^\d{4}-\d{2}-\d{2}$/.test(override) ? override : null;
  const want = valid ?? real;
  if (want < PLAN_START) return { date: PLAN_START, real, clamped: "before", overridden: Boolean(valid) };
  if (want > PLAN_END) return { date: PLAN_END, real, clamped: "after", overridden: Boolean(valid) };
  return { date: want, real, clamped: null, overridden: Boolean(valid) };
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function daysInRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}
