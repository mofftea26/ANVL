import { describe, expect, it } from 'vitest'

import {
  clampDropEditorPreviewWidthPx,
  DROP_EDITOR_PREVIEW_MAX_VIEWPORT_RATIO,
  DROP_EDITOR_PREVIEW_MIN_PX,
} from '@/features/admin/drops/dropEditorPreviewSash'

describe('clampDropEditorPreviewWidthPx', () => {
  it('clamps to min and max for a roomy container', () => {
    const w = 1200
    const max = Math.floor(w * DROP_EDITOR_PREVIEW_MAX_VIEWPORT_RATIO)
    expect(clampDropEditorPreviewWidthPx(100, w)).toBe(DROP_EDITOR_PREVIEW_MIN_PX)
    expect(clampDropEditorPreviewWidthPx(500, w)).toBe(500)
    expect(clampDropEditorPreviewWidthPx(900, w)).toBe(max)
  })

  it('collapses toward a single feasible width when 70% of container is below 320px', () => {
    const w = 400
    const max = Math.floor(w * DROP_EDITOR_PREVIEW_MAX_VIEWPORT_RATIO)
    expect(max).toBe(280)
    expect(clampDropEditorPreviewWidthPx(500, w)).toBe(280)
    expect(clampDropEditorPreviewWidthPx(100, w)).toBe(280)
  })

  it('handles non-finite inputs', () => {
    expect(clampDropEditorPreviewWidthPx(Number.NaN, 1000)).toBe(
      DROP_EDITOR_PREVIEW_MIN_PX,
    )
    expect(clampDropEditorPreviewWidthPx(500, Number.NaN)).toBe(
      DROP_EDITOR_PREVIEW_MIN_PX,
    )
    expect(clampDropEditorPreviewWidthPx(500, -10)).toBe(DROP_EDITOR_PREVIEW_MIN_PX)
  })
})
