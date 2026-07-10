import { describe, expect, it } from 'vitest'
import {
  countdownRemaining,
  resolveCountdownTargetMs,
} from '@/features/comingSoon/lib/countdownTarget'

describe('resolveCountdownTargetMs', () => {
  it('resolves a UTC wall-clock exactly', () => {
    expect(resolveCountdownTargetMs('2026-08-01T20:00', 'UTC')).toBe(
      Date.UTC(2026, 7, 1, 20, 0, 0),
    )
  })

  it('is timezone-aware (Beirut summer = UTC+3)', () => {
    // 20:00 in Beirut on Aug 1 (EEST, UTC+3) is 17:00 UTC.
    expect(resolveCountdownTargetMs('2026-08-01T20:00', 'Asia/Beirut')).toBe(
      Date.UTC(2026, 7, 1, 17, 0, 0),
    )
  })

  it('tracks DST (Beirut winter = UTC+2)', () => {
    // 20:00 in Beirut on Jan 15 (EET, UTC+2) is 18:00 UTC.
    expect(resolveCountdownTargetMs('2026-01-15T20:00', 'Asia/Beirut')).toBe(
      Date.UTC(2026, 0, 15, 18, 0, 0),
    )
  })

  it('supports western zones', () => {
    // 09:30 in New York on Mar 1 (EST, UTC-5) is 14:30 UTC.
    expect(resolveCountdownTargetMs('2026-03-01T09:30', 'America/New_York')).toBe(
      Date.UTC(2026, 2, 1, 14, 30, 0),
    )
  })

  it('returns null for blank or malformed dates', () => {
    expect(resolveCountdownTargetMs('', 'Asia/Beirut')).toBeNull()
    expect(resolveCountdownTargetMs('soon', 'Asia/Beirut')).toBeNull()
    expect(resolveCountdownTargetMs('2026-13-45T99:99', 'Asia/Beirut')).toBeNull()
  })

  it('returns null for an unknown timezone', () => {
    expect(resolveCountdownTargetMs('2026-08-01T20:00', 'Mars/Olympus')).toBeNull()
  })
})

describe('countdownRemaining', () => {
  it('splits the distance into segments', () => {
    const now = Date.UTC(2026, 6, 1, 0, 0, 0)
    const target = now + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000
    expect(countdownRemaining(target, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      complete: false,
    })
  })

  it('clamps at zero and reports completion once passed', () => {
    const now = Date.UTC(2026, 6, 1)
    expect(countdownRemaining(now - 1000, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      complete: true,
    })
  })
})
