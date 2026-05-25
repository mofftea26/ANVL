import { describe, expect, it } from 'vitest'
import { SEED_DROP } from '@/features/cms/api/seedSnapshots'
import {
  pickLocalActiveDropForStorefront,
  pickSupabaseActiveDropForStorefront,
} from '@/features/drops/hooks/useActiveDrop'

const liveDrop = { ...SEED_DROP, id: 'live-1', title: 'Live campaign' }

describe('pickLocalActiveDropForStorefront', () => {
  it('prefers live persisted drop over SSR seed snapshot', () => {
    expect(pickLocalActiveDropForStorefront(liveDrop, SEED_DROP)).toBe(liveDrop)
  })

  it('falls back to initial before live hydrates', () => {
    expect(pickLocalActiveDropForStorefront(null, SEED_DROP)).toBe(SEED_DROP)
  })
})

describe('pickSupabaseActiveDropForStorefront', () => {
  it('prefers published snapshot', () => {
    expect(pickSupabaseActiveDropForStorefront(liveDrop, SEED_DROP)).toBe(liveDrop)
  })

  it('uses SSR loader initial when publication not loaded yet', () => {
    expect(pickSupabaseActiveDropForStorefront(null, SEED_DROP)).toBe(SEED_DROP)
  })

  it('returns null when nothing published and no SSR initial', () => {
    expect(pickSupabaseActiveDropForStorefront(null, null)).toBeNull()
    expect(pickSupabaseActiveDropForStorefront(undefined, undefined)).toBeNull()
  })
})
