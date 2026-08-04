/**
 * The pdf.js boundary — the ONLY module in the app that imports pdfjs-dist.
 *
 * Parsing runs in the admin browser rather than on the server. The packs are
 * 45–74 MB and a Supabase Edge Function gets 256 MB of memory, so server-side
 * parsing would be permanently one slightly larger pack away from failing;
 * the browser has room, no cold start, and pdf.js is a first-class browser
 * library there. The PDF is uploaded to storage BEFORE parsing starts, so an
 * out-of-memory tab costs a re-parse rather than a re-upload.
 *
 * SSR safety matters here: this app renders on Cloudflare Workers, where
 * pdfjs-dist would not even load. The import is lazy, inside a function, and
 * guarded — nothing in the SSR graph can reach it, and `vendor-pdfjs` is split
 * out in `vite.config.ts` so no other admin page pays for it.
 */

import { isStrippedText } from './strip'
import type { ImagePlacement, Matrix, TechpackPageExtract, TextItem } from './pdfTypes'

type PdfjsModule = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PdfjsModule> | null = null

async function loadPdfjs(): Promise<PdfjsModule> {
  if (typeof window === 'undefined') {
    throw new Error('pdfjs is browser-only — techpack parsing cannot run on the server')
  }
  pdfjsPromise ??= (async () => {
    const pdfjs = await import('pdfjs-dist')
    // Defer to a worker the host already configured. Vite resolves the `?url`
    // import to a hashed asset in the browser build, which is what we want in
    // the app — but it is meaningless anywhere the bundler is not doing that
    // rewriting, so a host that has pointed pdf.js at its own worker keeps it.
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    }
    return pdfjs
  })()
  return pdfjsPromise
}

/** `m1 × m2` in PDF matrix order — concatenating a `cm` onto the current CTM. */
function multiply(m1: Matrix, m2: Matrix): Matrix {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ]
}

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

function isMatrix(value: unknown): value is Matrix {
  return Array.isArray(value) && value.length === 6 && value.every((n) => typeof n === 'number')
}

interface PdfTextItemLike {
  str?: string
  transform?: unknown
  width?: number
  height?: number
  fontName?: string
  hasEOL?: boolean
}

/**
 * Gate 1 of the stripping policy: drop offending runs at capture.
 *
 * Doing it here means a disclaimer can never become a table cell or a hotspot
 * label in the first place — later gates exist for phrases that only become
 * visible once several runs are joined.
 */
function toTextItems(rawItems: readonly unknown[]): TextItem[] {
  const out: TextItem[] = []
  for (const raw of rawItems) {
    const item = raw as PdfTextItemLike
    const str = typeof item.str === 'string' ? item.str : ''
    if (!str.trim()) continue
    if (isStrippedText(str)) continue
    if (!isMatrix(item.transform)) continue
    out.push({
      str,
      transform: item.transform,
      width: typeof item.width === 'number' ? item.width : 0,
      height: typeof item.height === 'number' ? item.height : 0,
      fontName: typeof item.fontName === 'string' ? item.fontName : '',
      hasEOL: item.hasEOL === true,
    })
  }
  return out
}

interface OperatorListLike {
  fnArray: number[]
  argsArray: unknown[]
}

/**
 * Walk the operator list keeping a CTM stack, recording where each image lands.
 *
 * Only placements are collected here — decoding the pixels is far more
 * expensive and is done on demand by `pdfImages.extractImage`, so a page whose
 * flat we never use costs nothing.
 *
 * Operator codes come from `OPS` rather than literals: the numeric values are
 * not a stable contract.
 */
function collectImagePlacements(
  ops: OperatorListLike,
  OPS: PdfjsModule['OPS'],
): ImagePlacement[] {
  const placements: ImagePlacement[] = []
  const stack: Matrix[] = []
  let ctm: Matrix = IDENTITY

  for (let i = 0; i < ops.fnArray.length; i += 1) {
    const fn = ops.fnArray[i]
    const args = ops.argsArray[i]

    if (fn === OPS.save) {
      stack.push(ctm)
    } else if (fn === OPS.restore) {
      ctm = stack.pop() ?? IDENTITY
    } else if (fn === OPS.transform) {
      if (isMatrix(args)) ctm = multiply(ctm, args)
    } else if (fn === OPS.paintImageXObject) {
      // `args = [objId, width, height]` — the intrinsic bitmap size travels
      // with the operator, so the flat can be scored without decoding a pixel.
      const objectKey = Array.isArray(args) && typeof args[0] === 'string' ? args[0] : ''
      if (objectKey) {
        const width = Array.isArray(args) && typeof args[1] === 'number' ? args[1] : 0
        const height = Array.isArray(args) && typeof args[2] === 'number' ? args[2] : 0
        placements.push({ objectKey, ctm, width, height })
      }
    } else if (fn === OPS.paintImageXObjectRepeat) {
      // Tiling form: `args = [objId, scaleX, scaleY, positions]`. The size
      // slots mean something else here, so they are left unknown rather than
      // recorded as pixel dimensions.
      const objectKey = Array.isArray(args) && typeof args[0] === 'string' ? args[0] : ''
      if (objectKey) {
        placements.push({ objectKey, ctm, width: 0, height: 0 })
      }
    }
  }

  return placements
}

export interface TechpackPdfSession {
  pageCount: number
  /** Text + image placements for one page. Cheap; safe to call per page. */
  readPage(pageNumber: number): Promise<TechpackPageExtract>
  /** The live pdf.js page, for `pdfImages.extractImage`. */
  getPage(pageNumber: number): Promise<unknown>
  /** Drop a page's cached data once its images have been uploaded. */
  releasePage(pageNumber: number): Promise<void>
  destroy(): Promise<void>
}

export interface OpenPdfOptions {
  onProgress?: (loaded: number, total: number) => void
}

/**
 * Open a PDF and expose it page by page.
 *
 * Deliberately NOT a "parse it all" call: the caller drives one page at a
 * time, uploads what it needs, and releases as it goes. Doing every page
 * concurrently is what runs a tab out of memory on a 74 MB pack.
 */
export async function openTechpackPdf(
  data: ArrayBuffer,
  options: OpenPdfOptions = {},
): Promise<TechpackPdfSession> {
  const pdfjs = await loadPdfjs()

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    // Techpacks are self-contained artwork; refusing the extras keeps both
    // memory and the attack surface down.
    disableFontFace: true,
    useSystemFonts: false,
  })

  if (options.onProgress) {
    loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      options.onProgress?.(loaded, total)
    }
  }

  const doc = await loadingTask.promise
  const pageCache = new Map<number, unknown>()

  async function page(pageNumber: number): Promise<unknown> {
    const cached = pageCache.get(pageNumber)
    if (cached) return cached
    const loaded = await doc.getPage(pageNumber)
    pageCache.set(pageNumber, loaded)
    return loaded
  }

  return {
    pageCount: doc.numPages,

    getPage: page,

    async readPage(pageNumber: number): Promise<TechpackPageExtract> {
      const pdfPage = (await page(pageNumber)) as {
        getViewport(opts: { scale: number }): { width: number; height: number }
        getTextContent(): Promise<{ items: unknown[] }>
        getOperatorList(): Promise<OperatorListLike>
      }

      const viewport = pdfPage.getViewport({ scale: 1 })
      // The operator list must be built before `page.objs` holds anything, so
      // image extraction later depends on this call having happened.
      const [textContent, ops] = await Promise.all([
        pdfPage.getTextContent(),
        pdfPage.getOperatorList(),
      ])

      return {
        page: pageNumber,
        viewport: { width: viewport.width, height: viewport.height },
        items: toTextItems(textContent.items),
        images: collectImagePlacements(ops, pdfjs.OPS),
      }
    },

    async releasePage(pageNumber: number): Promise<void> {
      const cached = pageCache.get(pageNumber) as { cleanup?: () => void } | undefined
      cached?.cleanup?.()
      pageCache.delete(pageNumber)
    },

    async destroy(): Promise<void> {
      pageCache.clear()
      await doc.cleanup()
      await loadingTask.destroy()
    },
  }
}
