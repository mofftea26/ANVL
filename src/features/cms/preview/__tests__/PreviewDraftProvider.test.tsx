/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_SHOP_CONFIG } from '@/features/cms/shop/shopExperience.zod'

import { PreviewDraftProvider, usePreviewDraft } from '../PreviewDraftProvider'
import { PREVIEW_PROTOCOL_VERSION } from '../previewBridge.types'

function Probe() {
  const draft = usePreviewDraft()
  if (draft === null) return <p>inactive</p>
  return <p>active:{draft.shopConfig ? 'with-shop' : 'empty'}</p>
}

function dispatch(data: unknown, origin: string = window.location.origin) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin }))
  })
}

describe('PreviewDraftProvider handshake', () => {
  it('stays inactive for real visitors (no candidate conditions)', () => {
    render(
      <PreviewDraftProvider>
        <Probe />
      </PreviewDraftProvider>,
    )
    dispatch({ type: 'anvl-preview/hello', v: PREVIEW_PROTOCOL_VERSION })
    expect(screen.getByText('inactive')).toBeTruthy()
  })

  it('announces ready on mount, activates on same-origin hello, applies drafts', () => {
    const parentSpy = vi.spyOn(window.parent, 'postMessage')
    render(
      <PreviewDraftProvider forceCandidate>
        <Probe />
      </PreviewDraftProvider>,
    )

    // Storefront-initiated side of the handshake.
    expect(parentSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'anvl-preview/ready' }),
      window.location.origin,
    )
    expect(screen.getByText('inactive')).toBeTruthy()

    dispatch({ type: 'anvl-preview/hello', v: PREVIEW_PROTOCOL_VERSION })
    expect(screen.getByText('active:empty')).toBeTruthy()

    dispatch({
      type: 'anvl-preview/draft',
      v: PREVIEW_PROTOCOL_VERSION,
      payload: { shopConfig: DEFAULT_SHOP_CONFIG },
    })
    expect(screen.getByText('active:with-shop')).toBeTruthy()
    parentSpy.mockRestore()
  })

  it('ignores hello from a foreign origin and drafts before pairing', () => {
    render(
      <PreviewDraftProvider forceCandidate>
        <Probe />
      </PreviewDraftProvider>,
    )

    dispatch({ type: 'anvl-preview/hello', v: PREVIEW_PROTOCOL_VERSION }, 'https://evil.example')
    expect(screen.getByText('inactive')).toBeTruthy()

    // A draft without a completed handshake is dropped too.
    dispatch({
      type: 'anvl-preview/draft',
      v: PREVIEW_PROTOCOL_VERSION,
      payload: { shopConfig: DEFAULT_SHOP_CONFIG },
    })
    expect(screen.getByText('inactive')).toBeTruthy()
  })
})
