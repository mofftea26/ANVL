import { describe, expect, it } from 'vitest'

import {
  isoToDatetimeLocalValue,
  localDateFromYyyyMmDd,
  localInputToIso,
  snapMinuteOfHour,
  yyyyMmDdFromLocalDate,
} from '@/features/admin/lib/adminDateTime'

describe('adminDateTime persistence helpers', () => {
  it('round-trips ISO timestamps ↔ datetime-local shaped walls while TZ semantics remain symmetric', () => {
    const iso = '2030-06-14T04:05:00.000Z'
    const wall = isoToDatetimeLocalValue(iso)
    expect(wall).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect(localInputToIso(wall)).toBe(iso)
  })

  it('returns undefined for whitespace datetime-local walls', () => {
    expect(localInputToIso('   ')).toBeUndefined()
  })

  it('round trips sane Gregorian calendars via yyyy-mm-dd', () => {
    const isoWall = localDateFromYyyyMmDd('2029-09-09')
    expect(isoWall).toBeDefined()
    expect(yyyyMmDdFromLocalDate(isoWall!)).toBe('2029-09-09')
  })

  it('rejects impossible Gregorian yyyy-mm-dd walls after rollover normalization', () => {
    expect(localDateFromYyyyMmDd('2024-02-30')).toBeUndefined()
  })

  it('snaps minute-of-hour increments honoring coarse granularity controls', () => {
    expect(snapMinuteOfHour(14, 15)).toBe(15)
    expect(snapMinuteOfHour(7, 15)).toBe(0)
    expect(snapMinuteOfHour(52, 15)).toBe(45)
    expect(snapMinuteOfHour(59, 60)).toBe(59)
  })
})
