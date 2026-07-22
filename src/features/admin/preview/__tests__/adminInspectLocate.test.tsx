/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { previewFieldAnchorId } from '@/features/cms/preview'

import {
  clearEditorAnchorHighlights,
  setEditorAnchorRing,
} from '../adminEditorHighlight'
import { locatePreviewTargetInEditor } from '../adminInspectLocate'

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

const RING_CLASS = 'anvl-admin-anchor-ring'

function mountAnchor(targetId: string) {
  const anchor = document.createElement('section')
  anchor.id = previewFieldAnchorId(targetId)
  const input = document.createElement('input')
  anchor.appendChild(input)
  document.body.appendChild(anchor)
  return { anchor, input }
}

afterEach(() => {
  clearEditorAnchorHighlights()
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

describe('locatePreviewTargetInEditor', () => {
  it('same page: scrolls, rings, and focuses the anchoring control', () => {
    const { anchor, input } = mountAnchor('shop:hero')
    const scrollSpy = vi.spyOn(anchor, 'scrollIntoView')
    const navigate = vi.fn()

    const result = locatePreviewTargetInEditor({
      targetId: 'shop:hero',
      currentAdminPath: '/admin/shop',
      navigate,
    })

    expect(result).toBe('located')
    expect(navigate).not.toHaveBeenCalled()
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'center' })
    expect(anchor.classList.contains(RING_CLASS)).toBe(true)
    expect(document.activeElement).toBe(input)
  })

  it('different page: navigates to the owning editor route', () => {
    const navigate = vi.fn()
    const result = locatePreviewTargetInEditor({
      targetId: 'about:orb-2',
      currentAdminPath: '/admin/shop',
      navigate,
    })
    expect(result).toBe('navigated')
    expect(navigate).toHaveBeenCalledWith('/admin/about')
  })

  it('the dashboard route is exact-match only (banner lives in a modal there)', () => {
    const navigate = vi.fn()
    // /admin/shop must NOT count as "on /admin" via prefixing.
    expect(
      locatePreviewTargetInEditor({
        targetId: 'banner:rail',
        currentAdminPath: '/admin/shop',
        navigate,
      }),
    ).toBe('navigated')
    expect(navigate).toHaveBeenCalledWith('/admin')

    navigate.mockClear()
    expect(
      locatePreviewTargetInEditor({
        targetId: 'banner:rail',
        currentAdminPath: '/admin',
        navigate,
      }),
    ).toBe('located')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('unmapped targets degrade to an info toast', () => {
    const navigate = vi.fn()

    expect(
      locatePreviewTargetInEditor({
        targetId: 'site:page',
        currentAdminPath: '/admin/shop',
        navigate,
      }),
    ).toBe('unmapped')
    expect(
      locatePreviewTargetInEditor({
        targetId: 'mystery:thing',
        currentAdminPath: '/admin/shop',
        navigate,
      }),
    ).toBe('unmapped')
    expect(toast.info).toHaveBeenCalledTimes(2)
    expect(toast.info).toHaveBeenCalledWith('No editor field maps to that element.')
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe('setEditorAnchorRing (inspect-hover mirror)', () => {
  it('rings without scrolling or focusing, and clears on null', () => {
    const { anchor, input } = mountAnchor('shop:grid')
    const scrollSpy = vi.spyOn(anchor, 'scrollIntoView')

    setEditorAnchorRing(previewFieldAnchorId('shop:grid'))
    expect(anchor.classList.contains(RING_CLASS)).toBe(true)
    expect(scrollSpy).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(input)

    setEditorAnchorRing(null)
    expect(anchor.classList.contains(RING_CLASS)).toBe(false)
  })
})
