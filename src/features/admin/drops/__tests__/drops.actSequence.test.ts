import { describe, expect, it } from 'vitest'
import {
  LANDING_ACT_SLOT_KEYS,
  defaultLandingActSequence,
  isSlotKey,
  normalizeLandingActSequence,
} from '@/features/admin/drops/drops.actSequence'

describe('landing act sequence helpers', () => {
  it('isSlotKey recognises every known slot and rejects unknown', () => {
    for (const k of LANDING_ACT_SLOT_KEYS) {
      expect(isSlotKey(k)).toBe(true)
    }
    expect(isSlotKey('hero-extra')).toBe(false)
    expect(isSlotKey('')).toBe(false)
  })

  it('defaultLandingActSequence emits every slot enabled in canonical order', () => {
    const seq = defaultLandingActSequence()
    expect(seq.map((s) => s.key)).toEqual([...LANDING_ACT_SLOT_KEYS])
    for (const s of seq) expect(s.enabled).toBe(true)
  })

  it('normalizeLandingActSequence preserves canonical order even when input is partial / shuffled', () => {
    const input = [
      { key: 'waitlist', enabled: false },
      { key: 'hero', enabled: true },
      // missing all the rest
    ] as ReturnType<typeof defaultLandingActSequence>
    const normalized = normalizeLandingActSequence(input)
    expect(normalized.map((s) => s.key)).toEqual([...LANDING_ACT_SLOT_KEYS])
    expect(normalized.find((s) => s.key === 'waitlist')?.enabled).toBe(false)
    expect(normalized.find((s) => s.key === 'hero')?.enabled).toBe(true)
    // unset slots default to enabled
    expect(normalized.find((s) => s.key === 'manifesto')?.enabled).toBe(true)
  })

  it('normalizeLandingActSequence drops unknown keys silently', () => {
    const input = [
      { key: 'mystery-act', enabled: true },
      { key: 'hero', enabled: false },
    ] as unknown as ReturnType<typeof defaultLandingActSequence>
    const normalized = normalizeLandingActSequence(input)
    expect(normalized.map((s) => s.key)).toEqual([...LANDING_ACT_SLOT_KEYS])
    expect(normalized.find((s) => s.key === 'hero')?.enabled).toBe(false)
  })

  it('normalizeLandingActSequence handles null/undefined safely', () => {
    expect(normalizeLandingActSequence(null).map((s) => s.key)).toEqual([
      ...LANDING_ACT_SLOT_KEYS,
    ])
    expect(normalizeLandingActSequence(undefined).map((s) => s.key)).toEqual([
      ...LANDING_ACT_SLOT_KEYS,
    ])
  })
})
