/**
 * The parser's input contract — deliberately zero-dependency.
 *
 * This is the seam that makes the whole parse layer testable. Exactly one file
 * (`pdfExtract.ts`) ever imports pdf.js; it produces these plain, serializable
 * structures, and every parser downstream is a pure function over them. That
 * means fixtures are small JSON files rather than 74 MB PDFs, and a pdf.js
 * upgrade can only break one module.
 *
 * Shapes mirror pdf.js's `TextItem` and image-XObject placements, but nothing
 * here imports from it — the types are restated so the contract is ours.
 */

/** A 2D affine matrix in PDF order: `[a, b, c, d, e, f]`. */
export type Matrix = readonly [number, number, number, number, number, number]

/**
 * One positioned text run.
 *
 * `transform` is in PDF user space, where **y grows upward from the bottom
 * left**. Convert with `itemBox()` before doing anything else — every parser
 * works in top-left space.
 */
export interface TextItem {
  str: string
  transform: Matrix
  width: number
  height: number
  fontName: string
  hasEOL: boolean
}

/** Where an image XObject was painted, and how big its bitmap is. */
export interface ImagePlacement {
  /** pdf.js object key, used later to pull the bytes via `page.objs.get`. */
  objectKey: string
  /** Placement matrix; for an unrotated image `|a|` = width, `|d|` = height. */
  ctm: Matrix
  /** Intrinsic bitmap width in pixels. */
  width: number
  /** Intrinsic bitmap height in pixels. */
  height: number
}

/** Everything the parsers need from one PDF page. */
export interface TechpackPageExtract {
  /** 1-based, matching what an operator sees in a PDF reader. */
  page: number
  viewport: { width: number; height: number }
  items: TextItem[]
  images: ImagePlacement[]
}
