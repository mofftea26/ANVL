import {
  TECHPACK_PARSER_VERSION,
  buildTechpackDocument,
  techpackIssueCount,
} from '@/features/techpacks/parse/buildDocument'
import { openTechpackPdf, type TechpackPdfSession } from '@/features/techpacks/parse/pdfExtract'
import { extractImage, type PdfPageLike } from '@/features/techpacks/parse/pdfImages'
import type { TechpackPageExtract } from '@/features/techpacks/parse/pdfTypes'
import type { TechpackDocument } from '@/features/techpacks/schema/techpack.zod'
import {
  applyTechpackImageRoles,
  uploadTechpackImage,
  uploadTechpackPdf,
} from './techpackFiles.service'
import {
  TECHPACKS_BUCKET,
  client,
  createTechpack,
  markTechpackFailed,
  saveTechpackParse,
  type TechpackResult,
} from './techpacks.service'

/**
 * One supplier PDF in, one reviewable `techpacks` row out.
 *
 * The ORDER here is the whole point:
 *
 * 1. Upload the PDF, then create the row, BEFORE a single page is parsed.
 *    Packs run 45–74 MB; if the tab runs out of memory mid-parse that costs a
 *    re-parse, not a re-upload, and the operator still has a row to look at.
 * 2. Walk pages STRICTLY SEQUENTIALLY. `Promise.all` over pages is the classic
 *    way to kill this: each page decodes its images to raw RGBA, so a whole
 *    pack in flight is hundreds of megabytes of pixels. Each page is read, its
 *    images extracted, uploaded and dropped, then released before the next.
 * 3. Build the document from the accumulated (small, plain-JSON) extracts, and
 *    save.
 *
 * Failure is recorded on the row as `failed` + the message, never swallowed:
 * a pack that silently parses into something sparse is far more dangerous than
 * one that visibly failed.
 */

export type TechpackIngestPhase =
  | 'uploading'
  | 'creating'
  | 'opening'
  | 'parsing'
  | 'saving'
  | 'done'

export interface TechpackIngestProgress {
  phase: TechpackIngestPhase
  /** 1-based page currently being read (parsing phase only). */
  page: number
  pageCount: number
  imagesStored: number
  message: string
  /**
   * The sub-step happening right now, in the operator's terms.
   *
   * The headline message names the phase; this names the work. Without it the
   * longest stretch of the whole ingest — pushing 60 MB at Supabase — showed a
   * bar pinned at 5% and one unchanging line, which reads as a hang rather
   * than as progress.
   */
  detail: string
  /**
   * 0–1 within the phase, or null when the step genuinely has no measurable
   * progress. Null drives an INDETERMINATE bar: a frozen percentage is a lie
   * about how far along the work is, and an honest "still going" beats it.
   */
  ratio: number | null
}

/** `59.7 MB` — operators judge "is this stuck?" against the file they picked. */
function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB'
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface TechpackIngestResult {
  id: string
  document: TechpackDocument
  /**
   * The raw per-page extracts. Kept so the dev-only "Download extract JSON"
   * action can serialise them — this is how parser fixtures get authored.
   */
  extracts: TechpackPageExtract[]
  imagesStored: number
  imagesSkipped: number
  /**
   * Non-empty when the pack parsed but its source PDF could not be stored.
   * The ingest succeeds — nothing published depends on the stored file — but
   * the operator is told, because re-parsing later will need the file again.
   */
  sourceSkipped: string
}

export interface IngestTechpackOptions {
  title?: string
  productSlug?: string
  onProgress?: (progress: TechpackIngestProgress) => void
}

/**
 * A page with more placements than this is a tiled pattern fill, not a set of
 * distinct artefacts. Storing hundreds of tiles per page buys nothing and
 * costs an operator's review time, so the tail is skipped and reported.
 */
const MAX_IMAGES_PER_PAGE = 40

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Best-effort cleanup when the row could never be created. */
async function removeOrphanUpload(path: string): Promise<void> {
  // Blank when the PDF was never stored (too large for the project's upload
  // limit) — there is nothing to clean up, and asking storage to remove '' is
  // a pointless round trip.
  if (!path) return
  const c = client()
  if (!c.ok) return
  await c.data.storage.from(TECHPACKS_BUCKET).remove([path])
}

interface PageImageOutcome {
  stored: number
  skipped: number
}

/**
 * Extract + upload every image on one page.
 *
 * `extractImage` is memoised per object key for the page's lifetime because a
 * pack routinely paints the same XObject twice; decoding it twice would double
 * the most expensive step. The cache dies with the page, so at most one page's
 * worth of encoded WebP is ever resident.
 *
 * Ref ids are `p{page}-i{index}` with `index` being the placement's position in
 * `extract.images` — byte-for-byte what `buildDocument.imageRefId` produces, so
 * `techpack_images.ref_id` joins the document's image refs.
 */
async function ingestPageImages(
  techpackId: string,
  page: PdfPageLike,
  extract: TechpackPageExtract,
): Promise<PageImageOutcome> {
  const cache = new Map<string, { blob: Blob; width: number; height: number; mime: string }>()
  let stored = 0
  let skipped = 0

  for (let index = 0; index < extract.images.length; index += 1) {
    if (index >= MAX_IMAGES_PER_PAGE) {
      skipped += extract.images.length - index
      break
    }
    const placement = extract.images[index]
    if (!placement) continue
    const refId = `p${extract.page}-i${index}`

    try {
      let image = cache.get(placement.objectKey)
      if (!image) {
        image = await extractImage(page, placement.objectKey)
        cache.set(placement.objectKey, image)
      }
      const res = await uploadTechpackImage(techpackId, refId, image.blob, {
        page: extract.page,
        width: image.width,
        height: image.height,
        mime: image.mime,
      })
      if (res.ok) stored += 1
      else skipped += 1
    } catch {
      // Image extraction is optional by design: a pack still yields sizing,
      // colorways, construction and care with no images at all.
      skipped += 1
    }
  }

  cache.clear()
  return { stored, skipped }
}

export async function ingestTechpack(
  file: File,
  options: IngestTechpackOptions = {},
): Promise<TechpackResult<TechpackIngestResult>> {
  const report = (progress: TechpackIngestProgress) => options.onProgress?.(progress)
  const base = { page: 0, pageCount: 0, imagesStored: 0, detail: '', ratio: null }

  // The single longest step, and the one with NO progress signal: supabase-js
  // exposes none for a standard upload. Naming the size and the reason is the
  // honest substitute for a percentage we cannot compute.
  report({
    ...base,
    phase: 'uploading',
    message: 'Uploading the techpack…',
    detail: `Sending ${formatBytes(file.size)} to private storage. This is the slow step on a large pack — keep this tab open.`,
  })
  const uploaded = await uploadTechpackPdf(file)
  if (!uploaded.ok) return uploaded

  report({
    ...base,
    phase: 'creating',
    message: 'Creating the techpack record…',
    detail: uploaded.data.sourceSkipped
      ? 'The PDF was too large to store; parsing continues from the file you picked.'
      : 'Stored. Registering it against your CMS account.',
  })
  const created = await createTechpack({
    title: options.title?.trim() || uploaded.data.filename.replace(/\.pdf$/i, ''),
    productSlug: options.productSlug ?? '',
    sourceFilename: uploaded.data.filename,
    sourcePath: uploaded.data.path,
    sourceByteSize: uploaded.data.byteSize,
  })
  if (!created.ok) {
    await removeOrphanUpload(uploaded.data.path)
    return created
  }

  const techpackId = created.data.id
  let session: TechpackPdfSession | null = null

  try {
    report({
      ...base,
      phase: 'opening',
      message: 'Opening the PDF…',
      detail: `Reading ${formatBytes(file.size)} into memory.`,
    })
    const buffer = await file.arrayBuffer()

    // pdf.js reports bytes as it builds the document, and this step is slow
    // enough on a 60 MB pack to look hung without it. The signal was always
    // there — `openTechpackPdf` has taken an `onProgress` since it was written.
    session = await openTechpackPdf(buffer, {
      onProgress: (loaded, total) => {
        report({
          ...base,
          phase: 'opening',
          message: 'Opening the PDF…',
          detail:
            total > 0
              ? `Indexed ${formatBytes(loaded)} of ${formatBytes(total)}.`
              : `Indexed ${formatBytes(loaded)}.`,
          ratio: total > 0 ? Math.min(1, loaded / total) : null,
        })
      },
    })

    const pageCount = session.pageCount
    const extracts: TechpackPageExtract[] = []
    let imagesStored = 0
    let imagesSkipped = 0

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const pageBase = { phase: 'parsing' as const, page: pageNumber, pageCount, imagesStored }
      const pageRatio = (pageNumber - 1) / pageCount

      report({
        ...pageBase,
        message: `Reading page ${pageNumber} of ${pageCount}…`,
        detail: 'Extracting text and measuring where every run sits.',
        ratio: pageRatio,
      })

      const extract = await session.readPage(pageNumber)
      extracts.push(extract)

      const pdfPage = (await session.getPage(pageNumber)) as PdfPageLike

      // Decoding and uploading a page's images dominates its time, so the
      // count is worth naming — 40 images on one page is a very different wait
      // from none, and the operator can see which it is.
      report({
        ...pageBase,
        message: `Reading page ${pageNumber} of ${pageCount}…`,
        detail:
          extract.images.length > 0
            ? `Decoding and uploading ${extract.images.length} image${extract.images.length === 1 ? '' : 's'}.`
            : 'No images on this page.',
        ratio: pageRatio,
      })

      const outcome = await ingestPageImages(techpackId, pdfPage, extract)
      imagesStored += outcome.stored
      imagesSkipped += outcome.skipped

      await session.releasePage(pageNumber)
    }

    report({
      phase: 'saving',
      page: pageCount,
      pageCount,
      imagesStored,
      message: 'Building the techpack document…',
      detail: 'Classifying pages and assembling every section.',
      ratio: null,
    })

    const document = buildTechpackDocument(extracts, { sourceFilename: file.name })

    const saved = await saveTechpackParse(techpackId, {
      document,
      pageCount: document.meta.pageCount,
      issueCount: techpackIssueCount(document),
      parserVersion: TECHPACK_PARSER_VERSION,
    })
    if (!saved.ok) {
      await markTechpackFailed(techpackId, saved.error)
      return saved
    }

    // Roles only exist once the document has been assembled.
    await applyTechpackImageRoles(techpackId, document.images)

    report({
      phase: 'done',
      page: pageCount,
      pageCount,
      imagesStored,
      message: 'Techpack parsed.',
      detail: `${imagesStored} image${imagesStored === 1 ? '' : 's'} stored.`,
      ratio: 1,
    })

    return {
      ok: true,
      data: {
        id: techpackId,
        document,
        extracts,
        imagesStored,
        imagesSkipped,
        sourceSkipped: uploaded.data.sourceSkipped,
      },
    }
  } catch (error) {
    const message = errorMessage(error)
    await markTechpackFailed(techpackId, message)
    return { ok: false, error: `Could not parse this techpack: ${message}` }
  } finally {
    // pdf.js holds worker-side buffers until the document is destroyed.
    await session?.destroy().catch(() => undefined)
  }
}
