/**
 * Admin datetime helpers — **wall-clock semantics** match the retired
 * `<input type="datetime-local">` convention:
 *
 * - We persist **UTC instants** as ISO‑8601 strings (`toISOString()`).
 * - The editor parses them with `new Date(iso)` and reads **local** calendar + clock
 *   fields (`getFullYear`, `getHours`, …) for display and calendar selection.
 *
 * Avoid storing raw `YYYY-MM-DDTHH:mm` strings as persistence: those are ambiguous
 * without a TZ. All saved values should remain full ISO timestamps.
 */

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Build the same string Safari/Chrome expose on `datetime-local` (minute precision). */
export function isoToDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Parses a `datetime-local` shaped string using the runtime local TZ, returns UTC ISO. */
export function localInputToIso(local: string): string | undefined {
  const t = local.trim()
  if (!t) return undefined
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function yyyyMmDdFromLocalDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function localDateFromYyyyMmDd(raw: string): Date | undefined {
  const v = raw.trim()
  if (!v) return undefined
  const d = new Date(`${v}T12:00:00`)
  if (Number.isNaN(d.getTime())) return undefined
  if (yyyyMmDdFromLocalDate(d) !== v) return undefined
  return d
}

export function coerceToDate(value: string | Date | undefined | null): Date | undefined {
  if (value == null) return undefined
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d
}

/** Local midnight for “today”; used before a persisted value exists. */
export function localStartOfToday(): Date {
  const n = new Date()
  n.setHours(0, 0, 0, 0)
  return n
}

export function snapMinuteOfHour(minute: number, stepMinutes: number): number {
  const step = Math.max(1, Math.min(59, Math.floor(stepMinutes)))
  if (step <= 1) return Math.min(59, Math.max(0, Math.round(minute)))
  const rounded = Math.round(minute / step) * step
  return Math.min(59, Math.max(0, rounded))
}

export function setLocalClock(
  base: Date,
  hour: number,
  minute: number,
): Date {
  const next = new Date(base.getTime())
  next.setHours(hour, minute, 0, 0)
  return next
}
