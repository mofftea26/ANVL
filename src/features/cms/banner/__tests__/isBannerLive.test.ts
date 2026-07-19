import { describe, expect, it } from 'vitest'

import { parseBannerConfig } from '@/features/cms/banner/bannerConfig.zod'
import { isBannerLive } from '@/features/cms/banner/isBannerLive'

const NOW = Date.parse('2026-07-19T12:00:00')
const PAST = '2026-07-19T10:00:00'
const FUTURE = '2026-07-19T14:00:00'

function config(overrides: {
  enabled?: boolean
  startAt?: string
  endAt?: string
}) {
  return parseBannerConfig({
    enabled: overrides.enabled ?? true,
    message: 'Free shipping this week',
    schedule: {
      startAt: overrides.startAt ?? '',
      endAt: overrides.endAt ?? '',
    },
  })
}

describe('isBannerLive', () => {
  it('is off while disabled, regardless of schedule', () => {
    expect(isBannerLive(config({ enabled: false }), NOW)).toBe(false)
    expect(
      isBannerLive(config({ enabled: false, startAt: PAST, endAt: FUTURE }), NOW),
    ).toBe(false)
  })

  it('manual enable alone (no schedule) is live', () => {
    expect(isBannerLive(config({ enabled: true }), NOW)).toBe(true)
  })

  it('waits for startAt when only a start is set', () => {
    expect(isBannerLive(config({ startAt: FUTURE }), NOW)).toBe(false)
    expect(isBannerLive(config({ startAt: PAST }), NOW)).toBe(true)
    // Boundary: now === startAt counts as started (now >= startAt).
    expect(isBannerLive(config({ startAt: PAST }), Date.parse(PAST))).toBe(true)
  })

  it('expires at endAt when only an end is set', () => {
    expect(isBannerLive(config({ endAt: FUTURE }), NOW)).toBe(true)
    expect(isBannerLive(config({ endAt: PAST }), NOW)).toBe(false)
    // Boundary: now === endAt is already expired (now < endAt required).
    expect(isBannerLive(config({ endAt: FUTURE }), Date.parse(FUTURE))).toBe(false)
  })

  it('requires being inside the window when both bounds are set', () => {
    expect(isBannerLive(config({ startAt: PAST, endAt: FUTURE }), NOW)).toBe(true)
    expect(
      isBannerLive(
        config({ startAt: PAST, endAt: FUTURE }),
        Date.parse('2026-07-19T09:00:00'),
      ),
    ).toBe(false)
    expect(
      isBannerLive(
        config({ startAt: PAST, endAt: FUTURE }),
        Date.parse('2026-07-19T15:00:00'),
      ),
    ).toBe(false)
  })

  it('treats unparseable datetimes as no constraint', () => {
    expect(isBannerLive(config({ startAt: 'not-a-date' }), NOW)).toBe(true)
    expect(isBannerLive(config({ endAt: 'not-a-date' }), NOW)).toBe(true)
  })

  it('ignores whitespace-only bounds', () => {
    expect(isBannerLive(config({ startAt: '  ', endAt: ' ' }), NOW)).toBe(true)
  })
})
