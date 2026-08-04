import type { TechpackPageExtract } from './pdfTypes'
import type {
  TechpackArtwork,
  TechpackBlueprint,
  TechpackBranding,
  TechpackColorway,
  TechpackHeader,
  TechpackIssueSeverity,
  TechpackPackaging,
  TechpackSizing,
  TechpackSwatch,
  TechpackTechnical,
  TechpackTrim,
} from '../schema/techpack.zod'

/**
 * The contract every page parser implements.
 *
 * Kept in its own module so `registry.ts` can reference the type without the
 * parsers having to import the registry — that cycle is what forces parsers to
 * know about each other, and they should not.
 */

export interface TechpackParseContext {
  /** Document-level header, already voted on across pages. */
  header: TechpackHeader
  /** Record something a human should look at. Never throws. */
  addIssue(input: {
    path: string
    code: string
    message: string
    severity?: TechpackIssueSeverity
    page?: number
  }): void
  /**
   * Stable reference id for an image on this page, so a parser can point at
   * one without knowing how storage is organised.
   */
  imageId(page: number, objectKey: string): string
}

/**
 * What one page contributed.
 *
 * Every field is optional: a page adds to the parts of the document it knows
 * about and stays silent about the rest, which is what lets packs differ in
 * which pages they carry.
 */
export interface TechpackPageResult {
  colorways?: TechpackColorway[]
  sizing?: TechpackSizing
  technical?: TechpackTechnical
  blueprint?: TechpackBlueprint
  branding?: TechpackBranding[]
  trims?: TechpackTrim[]
  prints?: TechpackArtwork[]
  knits?: TechpackArtwork[]
  swatches?: TechpackSwatch[]
  packaging?: TechpackPackaging
}

export type PageParser = (
  extract: TechpackPageExtract,
  ctx: TechpackParseContext,
) => TechpackPageResult
