import type { ImagePlacement, TechpackPageExtract, TextItem } from '../../pdfTypes'

/**
 * Test fixture builder.
 *
 * Tests describe pages in TOP-LEFT coordinates — the way anyone looking at the
 * page would — and this converts to the bottom-up PDF user space the real
 * extractor emits. That keeps fixtures readable while still exercising the
 * y-flip in `itemBox`, which is where inverted-geometry bugs would otherwise
 * hide behind a test that shares the bug.
 */

export interface TextSpec {
  text: string
  /** Top-left corner. */
  x: number
  y: number
  /** Defaults to a rough advance width for the string. */
  w?: number
  /** Glyph height; doubles as font size. */
  h?: number
}

export interface ImageSpec {
  key: string
  x: number
  y: number
  w: number
  h: number
  /** Intrinsic bitmap size; defaults to the placement size. */
  px?: number
  py?: number
}

export interface PageSpec {
  page?: number
  width?: number
  height?: number
  texts?: TextSpec[]
  images?: ImageSpec[]
}

const DEFAULT_WIDTH = 1000
const DEFAULT_HEIGHT = 700
const DEFAULT_TEXT_HEIGHT = 8

export function makeExtract(spec: PageSpec): TechpackPageExtract {
  const width = spec.width ?? DEFAULT_WIDTH
  const height = spec.height ?? DEFAULT_HEIGHT

  const items: TextItem[] = (spec.texts ?? []).map((t) => {
    const h = t.h ?? DEFAULT_TEXT_HEIGHT
    const w = t.w ?? t.text.length * h * 0.55
    return {
      str: t.text,
      // PDF space: [a,b,c,d,e,f] with f the baseline measured from the bottom.
      transform: [h, 0, 0, h, t.x, height - t.y - h] as const,
      width: w,
      height: h,
      fontName: 'g_d0_f1',
      hasEOL: false,
    }
  })

  const images: ImagePlacement[] = (spec.images ?? []).map((i) => ({
    objectKey: i.key,
    ctm: [i.w, 0, 0, i.h, i.x, height - i.y - i.h] as const,
    width: i.px ?? Math.round(i.w),
    height: i.py ?? Math.round(i.h),
  }))

  return {
    page: spec.page ?? 1,
    viewport: { width, height },
    items,
    images,
  }
}

/** The header block every techpack page repeats, positioned like the real packs. */
export function headerTexts(overrides: Partial<Record<string, string>> = {}): TextSpec[] {
  const product = overrides.product ?? 'MENS OVERSIZED TEE'
  const contrast = overrides.contrast ?? 'CONTRAST: SOLID (NONE)'
  const style = overrides.style ?? 'STYLE: ANVL-M-SS01-FW26'
  const colorways = overrides.colorways ?? 'COLORWAYS: 3 OF 3'
  const fabric =
    overrides.fabric ?? 'FABRIC: 100% COTTON | 260 GSM | SINGLE JERSEY WEFT KNIT TEXTILE CONSTRUCTION'
  return [
    { text: 'PRODUCT:', x: 40, y: 20 },
    { text: product, x: 40, y: 34 },
    { text: contrast, x: 260, y: 20 },
    { text: style, x: 260, y: 32 },
    { text: colorways, x: 260, y: 44 },
    { text: fabric, x: 260, y: 56, w: 300 },
    { text: 'CLIENT:', x: 40, y: 660 },
    { text: 'ANVL ATHLETICS', x: 40, y: 672 },
  ]
}

/** The right-aligned page title, set across two lines like the real packs. */
export function titleTexts(line1: string, line2 = '', pageWidth = DEFAULT_WIDTH): TextSpec[] {
  const h = 18
  const out: TextSpec[] = []
  const place = (text: string, y: number): TextSpec => {
    const w = text.length * h * 0.6
    return { text, x: pageWidth - 30 - w, y, w, h }
  }
  out.push(place(line1, 18))
  if (line2) out.push(place(line2, 40))
  return out
}
