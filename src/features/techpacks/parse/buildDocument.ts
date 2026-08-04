import { classifyPage } from './classifyPage'
import { mergeHeaders, parseHeader } from './header'
import { imagePlacementBox } from './geometry'
import type { TechpackPageExtract } from './pdfTypes'
import { PAGE_PARSERS } from './registry'
import type { TechpackParseContext, TechpackPageResult } from './parserContext'
import { stripDeep, stripFilename } from './strip'
import {
  EMPTY_TECHPACK_DOCUMENT,
  TECHPACK_SCHEMA_VERSION,
  countTechpackIssues,
  techpackDocumentSchema,
  type TechpackDocument,
  type TechpackImageRef,
  type TechpackIssue,
  type TechpackPageRecord,
} from '../schema/techpack.zod'

/**
 * Assemble a `TechpackDocument` from already-extracted pages.
 *
 * Pure and synchronous — it takes plain page extracts, not a PDF — so the
 * whole document build is testable from JSON fixtures without pdf.js or a
 * 74 MB file anywhere near the test run.
 */

export const TECHPACK_PARSER_VERSION = '1.0.0'

/** Above this share of unreadable pages, the pack is not our template at all. */
const UNKNOWN_PAGE_ALARM_RATIO = 0.3

export interface BuildDocumentOptions {
  sourceFilename?: string
  parsedAt?: string
}

/** Stable, human-readable image reference: `p6-i0`. */
function imageRefId(page: number, index: number): string {
  return `p${page}-i${index}`
}

function collectImageRefs(extracts: readonly TechpackPageExtract[]): {
  refs: TechpackImageRef[]
  keyToId: Map<string, string>
} {
  const refs: TechpackImageRef[] = []
  const keyToId = new Map<string, string>()

  for (const extract of extracts) {
    const { width, height } = extract.viewport
    extract.images.forEach((placement, index) => {
      const id = imageRefId(extract.page, index)
      // Key by page too: pdf.js object keys are only unique per document, and
      // the same cached image can legitimately appear on several pages.
      keyToId.set(`${extract.page}:${placement.objectKey}`, id)

      const box = imagePlacementBox(placement, height)
      refs.push({
        id,
        page: extract.page,
        role: 'unknown',
        width: placement.width || null,
        height: placement.height || null,
        pageBox: {
          x: width > 0 ? box.x / width : 0,
          y: height > 0 ? box.y / height : 0,
          w: width > 0 ? box.w / width : 0,
          h: height > 0 ? box.h / height : 0,
        },
      })
    })
  }

  return { refs, keyToId }
}

/** Merge one page's contribution into the document being assembled. */
function applyResult(doc: TechpackDocument, result: TechpackPageResult): void {
  if (result.colorways) doc.colorways.push(...result.colorways)
  if (result.blueprint) doc.blueprint.push(result.blueprint)
  if (result.branding) doc.branding.push(...result.branding)
  if (result.trims) doc.trims.push(...result.trims)
  if (result.prints) doc.prints.push(...result.prints)
  if (result.knits) doc.knits.push(...result.knits)
  if (result.swatches) doc.swatches.push(...result.swatches)
  // Single-instance sections: first page to produce one wins, so a stray
  // duplicate cannot overwrite a good read.
  if (result.sizing && !doc.sizing) doc.sizing = result.sizing
  if (result.technical && !doc.technical) doc.technical = result.technical
  if (result.packaging && !doc.packaging) doc.packaging = result.packaging
}

/** Tag extracted images with the role the parsers gave them. */
function assignImageRoles(doc: TechpackDocument): void {
  const roleById = new Map<string, TechpackImageRef['role']>()
  // Blueprints nominate nothing: a BASIC SPECS page has no image that IS the
  // garment drawing, and the crop we used to render instead is gone.
  if (doc.sizing?.diagramImageId) roleById.set(doc.sizing.diagramImageId, 'garment-flat')
  for (const artwork of doc.prints) if (artwork.imageId) roleById.set(artwork.imageId, 'graphic')
  for (const artwork of doc.knits) if (artwork.imageId) roleById.set(artwork.imageId, 'knit')
  for (const trim of doc.trims) if (trim.imageId) roleById.set(trim.imageId, 'trim')
  if (doc.packaging?.careLabel.imageId) {
    roleById.set(doc.packaging.careLabel.imageId, 'label')
  }

  doc.images = doc.images.map((ref) => ({ ...ref, role: roleById.get(ref.id) ?? ref.role }))
}

export function buildTechpackDocument(
  extracts: readonly TechpackPageExtract[],
  options: BuildDocumentOptions = {},
): TechpackDocument {
  const issues: TechpackIssue[] = []
  const addIssue: TechpackParseContext['addIssue'] = (input) => {
    issues.push({
      page: input.page ?? 0,
      path: input.path,
      code: input.code,
      message: input.message,
      severity: input.severity ?? 'warn',
    })
  }

  const { refs, keyToId } = collectImageRefs(extracts)
  const header = mergeHeaders(extracts.map((extract) => parseHeader(extract)))

  const ctx: TechpackParseContext = {
    header,
    addIssue,
    imageId: (page, objectKey) => keyToId.get(`${page}:${objectKey}`) ?? '',
  }

  const doc: TechpackDocument = {
    ...structuredClone(EMPTY_TECHPACK_DOCUMENT),
    schemaVersion: TECHPACK_SCHEMA_VERSION,
    header,
    images: refs,
  }

  const pages: TechpackPageRecord[] = []
  let unknownPages = 0

  for (const extract of extracts) {
    const { kind, title } = classifyPage(extract)
    pages.push({ page: extract.page, kind, title })

    if (kind === 'unknown') {
      unknownPages += 1
      addIssue({
        page: extract.page,
        path: `pages.${extract.page}`,
        code: 'page_kind_unknown',
        severity: 'info',
        message: `Page ${extract.page} did not match any known techpack page type.`,
      })
      continue
    }

    const parser = PAGE_PARSERS[kind]
    if (!parser) continue

    try {
      applyResult(doc, parser(extract, ctx))
    } catch (error) {
      // Fault isolation: one bad page must not cost the other twelve.
      addIssue({
        page: extract.page,
        path: `pages.${extract.page}`,
        code: 'page_parser_failed',
        severity: 'error',
        message: `Could not read this ${kind} page: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
    }
  }

  // Fail loud, not empty. A pack from a different supplier parses into
  // something that looks merely sparse, which is far more dangerous than an
  // obvious error — an operator would publish it without noticing.
  if (extracts.length > 0 && unknownPages / extracts.length > UNKNOWN_PAGE_ALARM_RATIO) {
    addIssue({
      path: 'pages',
      code: 'template_not_recognised',
      severity: 'error',
      message: `${unknownPages} of ${extracts.length} pages were unrecognised — this pack may use a different template, so treat everything extracted as suspect.`,
    })
  }

  doc.colorways.sort((a, b) => a.index - b.index)
  doc.blueprint.sort((a, b) => a.page - b.page)
  assignImageRoles(doc)

  doc.pages = pages
  doc.issues = issues
  doc.meta = {
    sourceFilename: stripFilename(options.sourceFilename ?? ''),
    pageCount: extracts.length,
    parserVersion: TECHPACK_PARSER_VERSION,
    parsedAt: options.parsedAt ?? new Date().toISOString(),
  }

  // Gate 2 of the stripping policy: a disclaimer split across several text
  // runs matches none of them individually, and only becomes visible once the
  // runs have been joined into labels and prose.
  const stripped = stripDeep(doc)
  return techpackDocumentSchema.parse(stripped)
}

/** Issues worth a human's attention — the number shown in the admin list. */
export function techpackIssueCount(doc: TechpackDocument): number {
  return countTechpackIssues(doc, 'warn')
}
