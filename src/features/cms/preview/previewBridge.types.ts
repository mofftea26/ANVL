import { z } from 'zod'

import { parseAssetConfig, type AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import { parseFontLibrary, type FontLibraryConfig } from '@/features/cms/config/fontLibrary'
import { parseThemeLibrary, type ThemeLibraryConfig } from '@/features/cms/config/themeLibrary'
import {
  parseComingSoonConfig,
  type ComingSoonConfig,
} from '@/features/cms/comingSoon/comingSoon.zod'
import {
  parseBannerConfig,
  type BannerConfig,
} from '@/features/cms/banner/bannerConfig.zod'
import {
  parseLegalContent,
  type LegalContentConfig,
} from '@/features/cms/legal/legalContent.zod'
import {
  parseSupportContent,
  type SupportContentConfig,
} from '@/features/cms/support/supportContent.zod'
import {
  parseLandingContentConfig,
  type LandingContentConfig,
} from '@/features/cms/landingContent/landingContent.zod'
import { parsePdpContent, type PdpContentConfig } from '@/features/cms/pdpContent/pdpContent.zod'
import {
  parsePassportContent,
  type PassportContentConfig,
} from '@/features/cms/passportContent/passportContent.zod'
import { parseShopConfig, type ShopConfig } from '@/features/cms/shop/shopExperience.zod'

/**
 * Admin live-preview wire protocol (v2).
 *
 * The admin embeds the real storefront in a same-origin iframe
 * (`/<route>?anvl-cms-preview=1`) and pushes the editors' UNSAVED in-memory
 * working copies over `postMessage`. The storefront activates only inside an
 * iframe, on the same origin, after a `hello` handshake — real visitors never
 * enter preview mode. Saved-local state needs no bridge (the storefront already
 * prefers this browser's saved CMS draft); only pre-save edits travel here.
 *
 * v2 adds INSPECTOR MODE (bidirectional inspection): the admin toggles
 * `inspect-mode`; the storefront then reports `inspect-hover` (element under
 * the cursor, null when unmapped) and `inspect-click` (locate-in-editor),
 * and echoes `inspect-mode { enabled: false }` when the user exits with
 * Escape inside the iframe. Parsers stay tolerant of v1 senders (v <= 2 is
 * accepted; v1 peers simply never emit the new message types).
 */
export const PREVIEW_QUERY_PARAM = 'anvl-cms-preview'
export const PREVIEW_PROTOCOL_VERSION = 2
/** Oldest wire version still accepted by both parsers. */
export const PREVIEW_PROTOCOL_MIN_VERSION = 1

function isSupportedProtocolVersion(v: number): boolean {
  return v >= PREVIEW_PROTOCOL_MIN_VERSION && v <= PREVIEW_PROTOCOL_VERSION
}

/** Unsaved editor state, keyed by the same slices the CMS persists. */
export interface PreviewDraftPayload {
  themeLibrary?: ThemeLibraryConfig
  fontLibrary?: FontLibraryConfig
  assetConfig?: AssetConfig
  landingContent?: LandingContentConfig
  shopConfig?: ShopConfig
  pdpContent?: PdpContentConfig
  passportContent?: PassportContentConfig
  comingSoon?: ComingSoonConfig
  banner?: BannerConfig
  legalContent?: LegalContentConfig
  supportContent?: SupportContentConfig
}

export type PreviewDraftField = keyof PreviewDraftPayload

export type PreviewTargetKind = 'asset-slot' | 'content-field'

export interface PreviewTarget {
  kind: PreviewTargetKind
  /** `context:slot`-style id, matching the upload-naming vocabulary. */
  id: string
}

const previewTargetSchema = z.object({
  kind: z.enum(['asset-slot', 'content-field']),
  id: z.string().min(1),
})

/** Envelope only — the draft payload is parsed per-slice below. */
const adminMessageEnvelopeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('anvl-preview/hello'), v: z.number() }),
  z.object({
    type: z.literal('anvl-preview/draft'),
    v: z.number(),
    payload: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('anvl-preview/focus'),
    v: z.number(),
    target: previewTargetSchema,
  }),
  z.object({
    type: z.literal('anvl-preview/hover'),
    v: z.number(),
    target: previewTargetSchema.nullable(),
  }),
  z.object({
    type: z.literal('anvl-preview/inspect-mode'),
    v: z.number(),
    enabled: z.boolean(),
  }),
])

export type AdminPreviewMessage =
  | { type: 'anvl-preview/hello'; v: number }
  | { type: 'anvl-preview/draft'; v: number; payload: PreviewDraftPayload }
  | { type: 'anvl-preview/focus'; v: number; target: PreviewTarget }
  /** Inspection-style highlight while an editor field is hovered; null clears. */
  | { type: 'anvl-preview/hover'; v: number; target: PreviewTarget | null }
  /** v2: turn the storefront's inspector mode on/off. */
  | { type: 'anvl-preview/inspect-mode'; v: number; enabled: boolean }

export type StorefrontPreviewMessage =
  | { type: 'anvl-preview/ready'; v: number; path: string }
  | { type: 'anvl-preview/located'; v: number; target: PreviewTarget; found: boolean }
  /** v2: element under the cursor while inspecting; null = no mapped target. */
  | { type: 'anvl-preview/inspect-hover'; v: number; target: PreviewTarget | null }
  /** v2: inspected element was clicked — the admin locates it in its editor. */
  | { type: 'anvl-preview/inspect-click'; v: number; target: PreviewTarget }
  /**
   * v2: mode-change echo — the storefront announces it exited inspect mode
   * itself (Escape pressed inside the iframe), so the admin toggle can follow.
   */
  | { type: 'anvl-preview/inspect-mode'; v: number; enabled: boolean }

const storefrontMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('anvl-preview/ready'), v: z.number(), path: z.string() }),
  z.object({
    type: z.literal('anvl-preview/located'),
    v: z.number(),
    target: previewTargetSchema,
    found: z.boolean(),
  }),
  z.object({
    type: z.literal('anvl-preview/inspect-hover'),
    v: z.number(),
    target: previewTargetSchema.nullable(),
  }),
  z.object({
    type: z.literal('anvl-preview/inspect-click'),
    v: z.number(),
    target: previewTargetSchema,
  }),
  z.object({
    type: z.literal('anvl-preview/inspect-mode'),
    v: z.number(),
    enabled: z.boolean(),
  }),
])

/** Per-slice parsers — each degrades to its designed defaults on bad input. */
const DRAFT_FIELD_PARSERS: {
  [K in PreviewDraftField]: (raw: unknown) => PreviewDraftPayload[K]
} = {
  themeLibrary: parseThemeLibrary,
  fontLibrary: parseFontLibrary,
  assetConfig: parseAssetConfig,
  landingContent: parseLandingContentConfig,
  shopConfig: parseShopConfig,
  pdpContent: parsePdpContent,
  passportContent: parsePassportContent,
  comingSoon: parseComingSoonConfig,
  banner: parseBannerConfig,
  legalContent: parseLegalContent,
  supportContent: parseSupportContent,
}

export const PREVIEW_DRAFT_FIELDS = Object.keys(DRAFT_FIELD_PARSERS) as PreviewDraftField[]

/** Parse only the fields present — absent slices stay undefined (published wins). */
export function parsePreviewDraftPayload(raw: Record<string, unknown>): PreviewDraftPayload {
  const payload: PreviewDraftPayload = {}
  for (const field of PREVIEW_DRAFT_FIELDS) {
    if (!(field in raw)) continue
    // Indexed write across a mapped-parser record — safe by construction.
    ;(payload as Record<string, unknown>)[field] = DRAFT_FIELD_PARSERS[field](raw[field])
  }
  return payload
}

/** Validate an inbound admin→storefront message; null for foreign/invalid data. */
export function parseAdminPreviewMessage(data: unknown): AdminPreviewMessage | null {
  const parsed = adminMessageEnvelopeSchema.safeParse(data)
  if (!parsed.success || !isSupportedProtocolVersion(parsed.data.v)) return null
  if (parsed.data.type === 'anvl-preview/draft') {
    return {
      type: 'anvl-preview/draft',
      v: parsed.data.v,
      payload: parsePreviewDraftPayload(parsed.data.payload),
    }
  }
  return parsed.data
}

/** Validate an inbound storefront→admin message; null for foreign/invalid data. */
export function parseStorefrontPreviewMessage(data: unknown): StorefrontPreviewMessage | null {
  const parsed = storefrontMessageSchema.safeParse(data)
  if (!parsed.success || !isSupportedProtocolVersion(parsed.data.v)) return null
  return parsed.data
}
