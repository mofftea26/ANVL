import { describe, expect, it } from 'vitest'
import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import {
  publicLandingActsFromDraftActs,
  publicLandingActsFromSequence,
  publicLandingActsHeroSlotOnly,
} from '@/features/cms/landing/landingActs.normalize'

describe('composeLandingPageFromDrop', () => {
  it('editorActsPreview uses only Drop.acts (never landingActSequence)', () => {
    const drop = createDefaultTheOathDrop()
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const disabledSlot = drop.landingActSequence.map((s) =>
      s.key === 'hero' ? { ...s, enabled: false } : s,
    )
    const composed = composeLandingPageFromDrop(
      { ...drop, landingActSequence: disabledSlot },
      layout,
      { editorActsPreview: true },
    )
    const expected = publicLandingActsFromDraftActs(drop.acts) ?? []
    expect(composed.landingActs).toEqual(expected)
    expect(composed.landingActs.length).toBeGreaterThan(0)
  })

  it('editorActsPreview yields empty acts when Drop.acts is empty', () => {
    const drop = { ...createDefaultTheOathDrop(), acts: [] }
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const composed = composeLandingPageFromDrop(drop, layout, {
      editorActsPreview: true,
      editorPreviewHeroFallback: false,
    })
    expect(composed.landingActs).toEqual([])
  })

  it('editorActsPreview with editorPreviewHeroFallback uses hero slot when acts empty', () => {
    const drop = { ...createDefaultTheOathDrop(), acts: [] }
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const composed = composeLandingPageFromDrop(drop, layout, {
      editorActsPreview: true,
      editorPreviewHeroFallback: true,
    })
    expect(composed.landingActs).toEqual(publicLandingActsHeroSlotOnly())
    expect(composed.landingActs.map((a) => a.nature)).toEqual(['hero'])
  })

  it('editorActsPreview with fallback when all acts disabled', () => {
    const drop = createDefaultTheOathDrop()
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const disabled = drop.acts.map((a) => ({ ...a, isEnabled: false }))
    const composed = composeLandingPageFromDrop(
      { ...drop, acts: disabled },
      layout,
      { editorActsPreview: true, editorPreviewHeroFallback: true },
    )
    expect(composed.landingActs).toEqual(publicLandingActsHeroSlotOnly())
  })

  it('editorActsPreview ignores fallback when editorPreviewHeroFallback omitted', () => {
    const drop = { ...createDefaultTheOathDrop(), acts: [] }
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const composed = composeLandingPageFromDrop(drop, layout, {
      editorActsPreview: true,
    })
    expect(composed.landingActs).toEqual([])
  })

  it('default compose still maps landingActSequence when acts empty', () => {
    const drop = { ...createDefaultTheOathDrop(), acts: [] }
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const composed = composeLandingPageFromDrop(drop, layout)
    expect(composed.landingActs).toEqual(
      publicLandingActsFromSequence(drop.landingActSequence),
    )
    expect(composed.landingActs.length).toBeGreaterThan(0)
  })

  it('storefront compose prefers Drop.acts when non-empty before sequence', () => {
    const drop = createDefaultTheOathDrop()
    const layout = createDefaultWebsiteLayout(drop.updatedAt)
    const composed = composeLandingPageFromDrop(drop, layout)
    expect(composed.landingActs).toEqual(
      publicLandingActsFromDraftActs(drop.acts) ?? [],
    )
    expect(composed.dropActs).toEqual(drop.acts)
  })
})
