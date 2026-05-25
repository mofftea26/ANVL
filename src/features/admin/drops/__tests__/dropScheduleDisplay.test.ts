import { describe, expect, it } from 'vitest'

import {
  formatDropScheduleLocal,
  resolveDropScheduleTiming,
  scheduleActivationHint,
} from '@/features/admin/drops/dropScheduleDisplay'

describe('dropScheduleDisplay', () => {
  it('marks future schedules separately from past-due', () => {
    const future = new Date(Date.now() + 60 * 60_000).toISOString()
    const past = new Date(Date.now() - 60_000).toISOString()

    expect(resolveDropScheduleTiming(future, 'scheduled')).toBe('future')
    expect(resolveDropScheduleTiming(past, 'scheduled')).toBe('past_due')
    expect(resolveDropScheduleTiming(past, 'inactive')).toBe('none')
  })

  it('explains past-due schedules in the hint copy', () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(scheduleActivationHint(past, 'scheduled')).toContain('has passed')
    expect(formatDropScheduleLocal(past).length).toBeGreaterThan(0)
  })
})
