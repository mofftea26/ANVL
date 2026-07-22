import { describe, expect, it } from 'vitest'

import { DEFAULT_SHOP_CONFIG } from '@/features/cms/shop/shopExperience.zod'

import {
  PREVIEW_PROTOCOL_VERSION,
  parseAdminPreviewMessage,
  parsePreviewDraftPayload,
  parseStorefrontPreviewMessage,
} from '../previewBridge.types'

describe('parseAdminPreviewMessage', () => {
  it('accepts a valid hello', () => {
    expect(
      parseAdminPreviewMessage({ type: 'anvl-preview/hello', v: PREVIEW_PROTOCOL_VERSION }),
    ).toEqual({ type: 'anvl-preview/hello', v: PREVIEW_PROTOCOL_VERSION })
  })

  it('rejects foreign, malformed, and wrong-version data', () => {
    expect(parseAdminPreviewMessage(null)).toBeNull()
    expect(parseAdminPreviewMessage('string')).toBeNull()
    expect(parseAdminPreviewMessage({ type: 'other-message' })).toBeNull()
    expect(parseAdminPreviewMessage({ type: 'anvl-preview/hello' })).toBeNull()
    expect(parseAdminPreviewMessage({ type: 'anvl-preview/hello', v: 99 })).toBeNull()
    expect(parseAdminPreviewMessage({ type: 'anvl-preview/hello', v: 0 })).toBeNull()
  })

  it('stays tolerant of v1 senders (v <= current accepted)', () => {
    expect(parseAdminPreviewMessage({ type: 'anvl-preview/hello', v: 1 })).toEqual({
      type: 'anvl-preview/hello',
      v: 1,
    })
    expect(
      parseAdminPreviewMessage({
        type: 'anvl-preview/hover',
        v: 1,
        target: { kind: 'content-field', id: 'shop:grid' },
      }),
    ).toMatchObject({ type: 'anvl-preview/hover' })
  })

  it('round-trips v2 inspect-mode', () => {
    expect(
      parseAdminPreviewMessage({
        type: 'anvl-preview/inspect-mode',
        v: PREVIEW_PROTOCOL_VERSION,
        enabled: true,
      }),
    ).toEqual({
      type: 'anvl-preview/inspect-mode',
      v: PREVIEW_PROTOCOL_VERSION,
      enabled: true,
    })
    expect(
      parseAdminPreviewMessage({
        type: 'anvl-preview/inspect-mode',
        v: PREVIEW_PROTOCOL_VERSION,
        enabled: 'yes',
      }),
    ).toBeNull()
  })

  it('parses draft payload slices and drops unknown fields', () => {
    const message = parseAdminPreviewMessage({
      type: 'anvl-preview/draft',
      v: PREVIEW_PROTOCOL_VERSION,
      payload: {
        shopConfig: DEFAULT_SHOP_CONFIG,
        totallyUnknownField: { evil: true },
      },
    })
    expect(message?.type).toBe('anvl-preview/draft')
    if (message?.type !== 'anvl-preview/draft') return
    expect(message.payload.shopConfig).toBeDefined()
    expect('totallyUnknownField' in message.payload).toBe(false)
    // Absent slices stay undefined — published data wins for them.
    expect(message.payload.themeLibrary).toBeUndefined()
    expect(message.payload.landingContent).toBeUndefined()
  })

  it('validates focus targets', () => {
    expect(
      parseAdminPreviewMessage({
        type: 'anvl-preview/focus',
        v: PREVIEW_PROTOCOL_VERSION,
        target: { kind: 'content-field', id: 'about:hero' },
      }),
    ).toEqual({
      type: 'anvl-preview/focus',
      v: PREVIEW_PROTOCOL_VERSION,
      target: { kind: 'content-field', id: 'about:hero' },
    })
    expect(
      parseAdminPreviewMessage({
        type: 'anvl-preview/focus',
        v: PREVIEW_PROTOCOL_VERSION,
        target: { kind: 'nope', id: '' },
      }),
    ).toBeNull()
  })
})

describe('parsePreviewDraftPayload', () => {
  it('degrades malformed slices to their designed defaults instead of crashing', () => {
    const payload = parsePreviewDraftPayload({ shopConfig: 'garbage' })
    expect(payload.shopConfig).toBeDefined()
  })
})

describe('parseStorefrontPreviewMessage', () => {
  it('round-trips ready and located', () => {
    expect(
      parseStorefrontPreviewMessage({
        type: 'anvl-preview/ready',
        v: PREVIEW_PROTOCOL_VERSION,
        path: '/about',
      }),
    ).toEqual({ type: 'anvl-preview/ready', v: PREVIEW_PROTOCOL_VERSION, path: '/about' })
    expect(
      parseStorefrontPreviewMessage({
        type: 'anvl-preview/located',
        v: PREVIEW_PROTOCOL_VERSION,
        target: { kind: 'asset-slot', id: 'about:heroImage' },
        found: true,
      }),
    ).toMatchObject({ found: true })
    // v1 messages stay accepted; out-of-range versions are rejected.
    expect(
      parseStorefrontPreviewMessage({ type: 'anvl-preview/ready', v: 1, path: '/' }),
    ).toMatchObject({ path: '/' })
    expect(
      parseStorefrontPreviewMessage({ type: 'anvl-preview/ready', v: 99, path: '/' }),
    ).toBeNull()
  })

  it('round-trips v2 inspect-hover, inspect-click, and the inspect-mode echo', () => {
    expect(
      parseStorefrontPreviewMessage({
        type: 'anvl-preview/inspect-hover',
        v: PREVIEW_PROTOCOL_VERSION,
        target: { kind: 'content-field', id: 'about:orb-2' },
      }),
    ).toEqual({
      type: 'anvl-preview/inspect-hover',
      v: PREVIEW_PROTOCOL_VERSION,
      target: { kind: 'content-field', id: 'about:orb-2' },
    })
    expect(
      parseStorefrontPreviewMessage({
        type: 'anvl-preview/inspect-hover',
        v: PREVIEW_PROTOCOL_VERSION,
        target: null,
      }),
    ).toEqual({
      type: 'anvl-preview/inspect-hover',
      v: PREVIEW_PROTOCOL_VERSION,
      target: null,
    })
    expect(
      parseStorefrontPreviewMessage({
        type: 'anvl-preview/inspect-click',
        v: PREVIEW_PROTOCOL_VERSION,
        target: { kind: 'content-field', id: 'banner:rail' },
      }),
    ).toMatchObject({ type: 'anvl-preview/inspect-click' })
    expect(
      parseStorefrontPreviewMessage({
        type: 'anvl-preview/inspect-click',
        v: PREVIEW_PROTOCOL_VERSION,
        target: null,
      }),
    ).toBeNull()
    expect(
      parseStorefrontPreviewMessage({
        type: 'anvl-preview/inspect-mode',
        v: PREVIEW_PROTOCOL_VERSION,
        enabled: false,
      }),
    ).toEqual({
      type: 'anvl-preview/inspect-mode',
      v: PREVIEW_PROTOCOL_VERSION,
      enabled: false,
    })
  })
})
