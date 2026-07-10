/**
 * Timezone-aware countdown target resolution.
 *
 * The CMS stores the launch moment as a local wall-clock datetime
 * (`YYYY-MM-DDTHH:mm`, from `<input type="datetime-local">`) plus an IANA
 * timezone. This converts that pair to a UTC epoch so every visitor counts
 * down to the same instant regardless of their own timezone.
 */

const LOCAL_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

type WallClock = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function parseWallClock(value: string): WallClock | null {
  const m = LOCAL_DATETIME_PATTERN.exec(value.trim())
  if (!m) return null
  const wall = {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4]),
    minute: Number(m[5]),
    second: m[6] ? Number(m[6]) : 0,
  }
  // Explicit range checks — `Date.UTC` would silently roll invalid parts over
  // (month 13 → January next year) instead of failing.
  if (wall.month < 1 || wall.month > 12) return null
  if (wall.day < 1 || wall.day > 31) return null
  if (wall.hour > 23 || wall.minute > 59 || wall.second > 59) return null
  return wall
}

/** Read the wall-clock a UTC instant shows in `timeZone`, as a UTC-encoded ms. */
function wallClockInZoneAsUtcMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts: Record<string, number> = {}
  for (const part of dtf.formatToParts(new Date(utcMs))) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value)
  }
  return Date.UTC(
    parts.year ?? 1970,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    // `hour12: false` can yield 24 for midnight in some engines.
    (parts.hour ?? 0) % 24,
    parts.minute ?? 0,
    parts.second ?? 0,
  )
}

/**
 * Convert a CMS wall-clock datetime + IANA timezone to a UTC epoch (ms).
 * Returns `null` for a blank/malformed date or an unknown timezone. Two
 * refinement passes make DST-transition datetimes resolve deterministically.
 */
export function resolveCountdownTargetMs(
  countdownDate: string,
  countdownTimezone: string,
): number | null {
  const wall = parseWallClock(countdownDate)
  if (!wall) return null

  const wallAsUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  )
  if (Number.isNaN(wallAsUtc)) return null

  try {
    let guess = wallAsUtc
    for (let i = 0; i < 2; i += 1) {
      const shown = wallClockInZoneAsUtcMs(guess, countdownTimezone)
      guess += wallAsUtc - shown
    }
    return guess
  } catch {
    // Unknown/invalid IANA name → treat as "no valid target" rather than
    // silently counting down to the wrong instant.
    return null
  }
}

export type CountdownRemaining = {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** True once the target instant has passed. */
  complete: boolean
}

/** Break the distance to `targetMs` into display segments (clamped at zero). */
export function countdownRemaining(
  targetMs: number,
  nowMs: number,
): CountdownRemaining {
  const delta = Math.max(0, targetMs - nowMs)
  const totalSeconds = Math.floor(delta / 1000)
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    complete: delta === 0,
  }
}
