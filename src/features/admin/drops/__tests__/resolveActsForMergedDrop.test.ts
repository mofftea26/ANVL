import { describe, expect, it } from 'vitest'
import { resolveActsForMergedDrop } from '@/features/admin/drops/drops.service'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import { landingContentToSimpleActs } from '@/features/admin/drops/acts/landingActs.seed'

describe('resolveActsForMergedDrop', () => {
  const base = createDefaultTheOathDrop()
  const mergedLanding = base.landingContent

  it('keeps an explicit empty acts array (no landing re-seed)', () => {
    expect(
      resolveActsForMergedDrop({ ...base, acts: [] }, mergedLanding),
    ).toEqual([])
  })

  it('copies non-empty acts when present', () => {
    const acts = base.acts
    expect(resolveActsForMergedDrop({ acts }, mergedLanding)).toEqual(acts)
  })

  it('falls back to landingContentToSimpleActs when acts key is absent', () => {
    const { acts: _a, ...noActsKey } = base
    const a = resolveActsForMergedDrop(noActsKey, mergedLanding)
    const b = landingContentToSimpleActs(mergedLanding)
    expect(
      a.map((x) => ({ nature: x.nature, sortOrder: x.sortOrder, preset: x.preset })),
    ).toEqual(
      b.map((x) => ({ nature: x.nature, sortOrder: x.sortOrder, preset: x.preset })),
    )
  })
})
