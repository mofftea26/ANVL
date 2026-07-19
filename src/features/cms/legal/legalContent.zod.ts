import { z } from 'zod'

/**
 * Legal content blob — the CMS-controlled copy for the site's legal pages
 * (Privacy, Terms, Cookies, Accessibility). Mirrors how `banner_config` /
 * `coming_soon` flow: edited locally → `adminCmsRemoteSync` →
 * `cms_settings.legal_content` + `storefront_publication.legal_content` → SSR
 * projection.
 *
 * PERSISTENCE DEFAULTS ARE BLANK. Every text field defaults to '' here, so a
 * fresh/empty blob carries no copy of its own — the render-ready page comes
 * from `resolveLegalContent`, which merges these CMS values over the FULL
 * designed defaults in `legalContent.defaults.ts` (blank string = "use the
 * default"). This keeps the stored blob small and lets code-owned copy evolve
 * without a migration.
 *
 * Persistence schemas are `.strict()`; `parseLegalContent` deep-picks only the
 * known keys first, so legacy/tampered blobs degrade to defaults instead of
 * throwing (one bad section can never wipe the whole page).
 *
 * `body` is plain text; a blank line separates paragraphs. `id` gives each
 * section a stable key for list rendering + drag-reorder.
 */

export const LEGAL_PAGE_KEYS = ['privacy', 'terms', 'cookies', 'accessibility'] as const
export type LegalPageKey = (typeof LEGAL_PAGE_KEYS)[number]

export const legalSectionSchema = z
  .object({
    id: z.string().catch(''),
    heading: z.string().catch(''),
    body: z.string().catch(''),
  })
  .strict()

export type LegalSection = z.infer<typeof legalSectionSchema>

export const legalPageSchema = z
  .object({
    title: z.string().catch(''),
    /** ISO date (`YYYY-MM-DD`) or ''. */
    updatedAt: z.string().catch(''),
    intro: z.string().catch(''),
    sections: z.array(legalSectionSchema).catch([]),
  })
  .strict()

export type LegalPage = z.infer<typeof legalPageSchema>

export const legalContentSchema = z
  .object({
    pages: z
      .object({
        privacy: legalPageSchema,
        terms: legalPageSchema,
        cookies: legalPageSchema,
        accessibility: legalPageSchema,
      })
      .strict(),
  })
  .strict()

export type LegalContentConfig = z.infer<typeof legalContentSchema>

/** Blank page — the persistence default (real copy lives in the resolver). */
export function blankLegalPage(): LegalPage {
  return { title: '', updatedAt: '', intro: '', sections: [] }
}

/** Blank persistence default: every page empty → resolver supplies all copy. */
export const DEFAULT_LEGAL_CONTENT: LegalContentConfig = {
  pages: {
    privacy: blankLegalPage(),
    terms: blankLegalPage(),
    cookies: blankLegalPage(),
    accessibility: blankLegalPage(),
  },
}

function pickSection(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  // Start from a full blank section so every key is present before parse.
  const out: Record<string, unknown> = { id: '', heading: '', body: '' }
  for (const key of ['id', 'heading', 'body'] as const) {
    if (key in r) out[key] = r[key]
  }
  return out
}

function pickPage(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const r = raw as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of ['title', 'updatedAt', 'intro'] as const) {
    if (key in r) out[key] = r[key]
  }
  if (Array.isArray(r.sections)) {
    out.sections = r.sections.map(pickSection).filter((s): s is Record<string, unknown> => s !== null)
  }
  return out
}

/**
 * Parse any stored legal blob into a complete, valid {@link LegalContentConfig}.
 * Non-object input → blank defaults. Object input → known keys are deep-picked
 * (unknown keys dropped) then per-field `.catch` defaults fill any gaps, so old
 * or partial blobs upgrade silently and never throw despite the strict schema.
 */
export function parseLegalContent(raw: unknown): LegalContentConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return legalContentSchema.parse({
      pages: {
        privacy: blankLegalPage(),
        terms: blankLegalPage(),
        cookies: blankLegalPage(),
        accessibility: blankLegalPage(),
      },
    })
  }
  const pagesRaw = (raw as Record<string, unknown>).pages
  const pagesObj =
    pagesRaw && typeof pagesRaw === 'object' && !Array.isArray(pagesRaw)
      ? (pagesRaw as Record<string, unknown>)
      : {}
  // Spread a blank page under each picked page so every key is present (a
  // `.catch` default only fires on a *wrong type*, not a *missing* key); any
  // present-but-wrong-typed field is then degraded by the schema's `.catch`.
  return legalContentSchema.parse({
    pages: {
      privacy: { ...blankLegalPage(), ...pickPage(pagesObj.privacy) },
      terms: { ...blankLegalPage(), ...pickPage(pagesObj.terms) },
      cookies: { ...blankLegalPage(), ...pickPage(pagesObj.cookies) },
      accessibility: { ...blankLegalPage(), ...pickPage(pagesObj.accessibility) },
    },
  })
}
