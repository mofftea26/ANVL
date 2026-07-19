import { LEGAL_CONTENT_DEFAULTS } from '@/features/cms/legal/legalContent.defaults'
import {
  LEGAL_PAGE_KEYS,
  type LegalContentConfig,
  type LegalPage,
  type LegalPageKey,
  type LegalSection,
} from '@/features/cms/legal/legalContent.zod'

/**
 * Render-ready legal content: the CMS `legal_content` blob merged over the FULL
 * designed defaults (blank string = "use the default"). Scalars fall back per
 * field; `sections` fall back as a whole block when the CMS list is empty, and
 * otherwise use the authored sections (fully-empty rows dropped).
 *
 * Storefront-safe and pure — the page agent renders straight off this shape.
 */

export type ResolvedLegalSection = {
  id: string
  heading: string
  body: string
}

export type ResolvedLegalPage = {
  title: string
  /** ISO date or '' (blank hides the "Last updated" stamp). */
  updatedAt: string
  intro: string
  sections: ResolvedLegalSection[]
}

export type ResolvedLegalContent = Record<LegalPageKey, ResolvedLegalPage>

function text(value: string, fallback: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function resolveSections(
  cmsSections: LegalSection[],
  fallback: LegalSection[],
): ResolvedLegalSection[] {
  const authored = cmsSections.filter(
    (s) => s.heading.trim().length > 0 || s.body.trim().length > 0,
  )
  const source = authored.length > 0 ? authored : fallback
  return source.map((s, index) => ({
    id: s.id.trim() || `section-${index}`,
    heading: s.heading,
    body: s.body,
  }))
}

function resolvePage(cms: LegalPage, defaults: LegalPage): ResolvedLegalPage {
  return {
    title: text(cms.title, defaults.title),
    // Dates are exact: a blank CMS value means "use the designed default".
    updatedAt: text(cms.updatedAt, defaults.updatedAt),
    intro: text(cms.intro, defaults.intro),
    sections: resolveSections(cms.sections, defaults.sections),
  }
}

export function resolveLegalContent(config: LegalContentConfig): ResolvedLegalContent {
  const out = {} as ResolvedLegalContent
  for (const key of LEGAL_PAGE_KEYS) {
    out[key] = resolvePage(config.pages[key], LEGAL_CONTENT_DEFAULTS[key])
  }
  return out
}

/** Convenience: resolve a single legal page by key. */
export function resolveLegalPage(
  config: LegalContentConfig,
  key: LegalPageKey,
): ResolvedLegalPage {
  return resolvePage(config.pages[key], LEGAL_CONTENT_DEFAULTS[key])
}
