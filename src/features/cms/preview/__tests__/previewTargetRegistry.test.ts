import { describe, expect, it } from 'vitest'

import {
  previewFieldAnchorId,
  resolvePreviewTargetToEditor,
} from '../previewTargetRegistry'

/**
 * Every target id the storefront emits today (usePreviewTargetProps call
 * sites + the Oath's data-scene fallback). Keep in sync when new emitters
 * appear — the registry must know every one of them.
 */
const EMITTED_TARGET_IDS: Array<{ id: string; adminRoute: string | null }> = [
  { id: 'site:page', adminRoute: null }, // whole-page marker — unowned
  { id: 'shop:hero', adminRoute: '/admin/shop' },
  { id: 'shop:toolbar', adminRoute: '/admin/shop' },
  { id: 'shop:grid', adminRoute: '/admin/shop' },
  { id: 'the-oath:hero', adminRoute: '/admin/content' },
  { id: 'the-oath:manifesto', adminRoute: '/admin/content' },
  { id: 'the-oath:tenets', adminRoute: '/admin/content' },
  { id: 'the-oath:products', adminRoute: '/admin/content' },
  { id: 'the-oath:finale', adminRoute: '/admin/content' },
  { id: 'about:hero', adminRoute: '/admin/about' },
  { id: 'about:marquee', adminRoute: '/admin/about' },
  { id: 'about:orb-1', adminRoute: '/admin/about' },
  { id: 'about:orb-10', adminRoute: '/admin/about' },
  // Banner is a dashboard modal now — locate lands on the dashboard.
  { id: 'banner:rail', adminRoute: '/admin' },
  { id: 'coming-soon:page', adminRoute: '/admin/coming-soon' },
]

describe('resolvePreviewTargetToEditor', () => {
  it('recognizes every target id the storefront emits', () => {
    for (const { id, adminRoute } of EMITTED_TARGET_IDS) {
      const match = resolvePreviewTargetToEditor(id)
      if (adminRoute === null) {
        expect(match, id).toBeNull()
      } else {
        expect(match?.adminRoute, id).toBe(adminRoute)
        expect(match?.anchorId, id).toBe(previewFieldAnchorId(id))
      }
    }
  })

  it('matches orbs by index without over-matching', () => {
    expect(resolvePreviewTargetToEditor('about:orb-3')?.adminRoute).toBe('/admin/about')
    expect(resolvePreviewTargetToEditor('about:orb-42')?.adminRoute).toBe('/admin/about')
    expect(resolvePreviewTargetToEditor('about:orb-')).toBeNull()
    expect(resolvePreviewTargetToEditor('about:orb-x')).toBeNull()
    expect(resolvePreviewTargetToEditor('about:orbit-1')).toBeNull()
  })

  it('returns null for unknown ids', () => {
    expect(resolvePreviewTargetToEditor('')).toBeNull()
    expect(resolvePreviewTargetToEditor('mystery:thing')).toBeNull()
    expect(resolvePreviewTargetToEditor('shop:heroic')).toBeNull()
    expect(resolvePreviewTargetToEditor('the-oath:credits')).toBeNull()
  })
})

describe('previewFieldAnchorId', () => {
  it('produces stable, id-safe anchors', () => {
    expect(previewFieldAnchorId('about:orb-3')).toBe('pt-anchor-about-orb-3')
    expect(previewFieldAnchorId('coming-soon:page')).toBe('pt-anchor-coming-soon-page')
    expect(previewFieldAnchorId('the-oath:hero')).toBe('pt-anchor-the-oath-hero')
    // Any non-id-safe run collapses to a single dash.
    expect(previewFieldAnchorId('a::b  c')).toBe('pt-anchor-a-b-c')
  })
})
