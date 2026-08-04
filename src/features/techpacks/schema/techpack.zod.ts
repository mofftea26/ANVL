import { z } from 'zod'

import { techpackBlueprintSchema } from './techpackBlueprint.zod'
import { techpackImageRefSchema } from './techpackImages.zod'
import {
  techpackArtworkSchema,
  techpackBrandingSchema,
  techpackColorwaySchema,
  techpackPackagingSchema,
  techpackSizingSchema,
  techpackTechnicalSchema,
  techpackSwatchSchema,
  techpackTrimSchema,
} from './techpackPages.zod'
import {
  techpackHeaderSchema,
  techpackIssueSchema,
  techpackMetaSchema,
  techpackPageRecordSchema,
} from './techpackShared.zod'

/**
 * The normalized techpack document — the deterministic parse of one supplier
 * PDF, and the contract between the parser, the admin review UI, and the
 * import mappers.
 *
 * This file composes the module family and RE-EXPORTS all of it, so consumers
 * only ever import from `@/features/techpacks/schema/techpack.zod`.
 *
 * Two invariants worth stating outright:
 * - Nothing here is ever written by the AI step. Suggestions live beside the
 *   document in `techpacks.ai_document` and are accepted field by field, so a
 *   model can never quietly replace an extracted fact.
 * - Absent sections are empty, not missing. Every block is `.nullable()` or
 *   `.catch([])`, because packs legitimately differ in which pages they carry.
 */

export const TECHPACK_SCHEMA_VERSION = 1

export const techpackDocumentSchema = z.object({
  schemaVersion: z.literal(TECHPACK_SCHEMA_VERSION).catch(TECHPACK_SCHEMA_VERSION),
  meta: techpackMetaSchema.catch({
    sourceFilename: '',
    pageCount: 0,
    parserVersion: '',
    parsedAt: '',
  }),
  header: techpackHeaderSchema.catch({
    product: '',
    contrast: '',
    style: '',
    colorwayCount: 0,
    fabric: { raw: '', composition: [], gsm: null, construction: '' },
    client: '',
  }),
  colorways: z.array(techpackColorwaySchema).catch([]),
  sizing: techpackSizingSchema.nullable().catch(null),
  technical: techpackTechnicalSchema.nullable().catch(null),
  /** One entry per BASIC SPECS page (packs carry one or two). */
  blueprint: z.array(techpackBlueprintSchema).catch([]),
  branding: z.array(techpackBrandingSchema).catch([]),
  trims: z.array(techpackTrimSchema).catch([]),
  /** PATTERN PRINTS AND GRAPHICS. */
  prints: z.array(techpackArtworkSchema).catch([]),
  /** SEAMLESS KNITS AND TEXTURES. */
  knits: z.array(techpackArtworkSchema).catch([]),
  swatches: z.array(techpackSwatchSchema).catch([]),
  packaging: techpackPackagingSchema.nullable().catch(null),
  images: z.array(techpackImageRefSchema).catch([]),
  /** Page-by-page classification, so a mis-read page is visible in review. */
  pages: z.array(techpackPageRecordSchema).catch([]),
  issues: z.array(techpackIssueSchema).catch([]),
})
export type TechpackDocument = z.infer<typeof techpackDocumentSchema>

/** An empty document — the starting point for a parse and the parse-failure value. */
export const EMPTY_TECHPACK_DOCUMENT: TechpackDocument = {
  schemaVersion: TECHPACK_SCHEMA_VERSION,
  meta: { sourceFilename: '', pageCount: 0, parserVersion: '', parsedAt: '' },
  header: {
    product: '',
    contrast: '',
    style: '',
    colorwayCount: 0,
    fabric: { raw: '', composition: [], gsm: null, construction: '' },
    client: '',
  },
  colorways: [],
  sizing: null,
  technical: null,
  blueprint: [],
  branding: [],
  trims: [],
  prints: [],
  knits: [],
  swatches: [],
  packaging: null,
  images: [],
  pages: [],
  issues: [],
}

/**
 * Parse a stored `techpacks.document` blob.
 *
 * Never throws: a row written by an older parser, or hand-edited into an
 * invalid shape, degrades to whatever still parses rather than taking the
 * admin page down with it.
 */
export function parseTechpackDocument(raw: unknown): TechpackDocument {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return structuredClone(EMPTY_TECHPACK_DOCUMENT)
  }
  const parsed = techpackDocumentSchema.safeParse(raw)
  return parsed.success ? parsed.data : structuredClone(EMPTY_TECHPACK_DOCUMENT)
}

/** Count issues at or above a severity — drives `techpacks.issue_count`. */
export function countTechpackIssues(
  doc: TechpackDocument,
  minSeverity: 'error' | 'warn' | 'info' = 'warn',
): number {
  const rank = { info: 0, warn: 1, error: 2 } as const
  const floor = rank[minSeverity]
  return doc.issues.filter((issue) => rank[issue.severity] >= floor).length
}

export * from './techpackBlueprint.zod'
export * from './techpackImages.zod'
export * from './techpackPages.zod'
export * from './techpackShared.zod'
