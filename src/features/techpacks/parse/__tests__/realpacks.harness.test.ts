/**
 * Runs the parser over REAL supplier techpack PDFs and writes a report per pack.
 *
 * This is the test that matters. The fixture suites are hand-built from reading
 * the PDFs, so they encode what I BELIEVED the layout was — and when this
 * harness was first pointed at the actual files it found that fabric,
 * composition, GSM and every colorway were being dropped, and that no hotspot
 * had a usable coordinate. Fixtures cannot catch that class of error.
 *
 * The PDFs live outside the repo (they are supplier documents, not source), so
 * the suite SKIPS when they are absent rather than failing on another machine.
 * Point `ANVL_TECHPACK_DIRS` at one or more folders of packs, separated by `;`,
 * to run it elsewhere.
 *
 * Reports and raw page geometry are written to the scratch dir for diagnosis —
 * `report-<pack>.json` and `raw-<pack>.json`.
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'

/*
 * jsdom implements neither DOMMatrix nor Path2D, and pdf.js touches both when
 * its canvas display module is evaluated. A real browser has them, so these
 * stubs exist only to get the library loaded here — nothing renders, and the
 * code under test never calls into them.
 */
const g = globalThis as unknown as Record<string, unknown>
if (typeof g.DOMMatrix === 'undefined') {
  g.DOMMatrix = class {
    a = 1
    b = 0
    c = 0
    d = 1
    e = 0
    f = 0
    constructor(init?: number[]) {
      if (Array.isArray(init)) {
        ;[this.a, this.b, this.c, this.d, this.e, this.f] = init as [
          number, number, number, number, number, number,
        ]
      }
    }
  }
}
/*
 * pdf.js 6 uses the very new Uint8Array hex/base64 proposal methods. Browsers
 * that run this app have them; this Node version does not.
 */
const u8 = Uint8Array.prototype as unknown as Record<string, unknown>
if (typeof u8.toHex !== 'function') {
  u8.toHex = function toHex(this: Uint8Array): string {
    let out = ''
    for (const byte of this) out += byte.toString(16).padStart(2, '0')
    return out
  }
}
if (typeof u8.toBase64 !== 'function') {
  u8.toBase64 = function toBase64(this: Uint8Array): string {
    return Buffer.from(this).toString('base64')
  }
}
if (typeof (Uint8Array as unknown as Record<string, unknown>).fromHex !== 'function') {
  ;(Uint8Array as unknown as Record<string, unknown>).fromHex = (hex: string) =>
    new Uint8Array(Buffer.from(hex, 'hex'))
}
if (typeof (Uint8Array as unknown as Record<string, unknown>).fromBase64 !== 'function') {
  ;(Uint8Array as unknown as Record<string, unknown>).fromBase64 = (b64: string) =>
    new Uint8Array(Buffer.from(b64, 'base64'))
}

/* Map.getOrInsert / getOrInsertComputed — another proposal pdf.js 6 assumes. */
for (const Ctor of [Map, WeakMap]) {
  const proto = Ctor.prototype as unknown as Record<string, unknown>
  if (typeof proto.getOrInsert !== 'function') {
    proto.getOrInsert = function getOrInsert(this: Map<unknown, unknown>, key: unknown, value: unknown) {
      if (!this.has(key)) this.set(key, value)
      return this.get(key)
    }
  }
  if (typeof proto.getOrInsertComputed !== 'function') {
    proto.getOrInsertComputed = function getOrInsertComputed(
      this: Map<unknown, unknown>,
      key: unknown,
      compute: (k: unknown) => unknown,
    ) {
      if (!this.has(key)) this.set(key, compute(key))
      return this.get(key)
    }
  }
}

if (typeof g.Path2D === 'undefined') {
  g.Path2D = class {
    addPath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    closePath() {}
    rect() {}
  }
}

import { buildTechpackDocument } from '../buildDocument'
import { openTechpackPdf } from '../pdfExtract'
import type { TechpackPageExtract } from '../pdfTypes'

/** Override with ANVL_TECHPACK_DIRS (';'-separated) to run this elsewhere. */
const DEFAULT_DIRS = [
  'C:/Users/Moff/Downloads/drive-download-20260729T072949Z-1-001',
  'C:/Users/Moff/Downloads/drive-download-20260729T072936Z-1-001',
]
const DIRS = (process.env.ANVL_TECHPACK_DIRS ?? '').trim()
  ? (process.env.ANVL_TECHPACK_DIRS ?? '').split(';').map((d) => d.trim()).filter(Boolean)
  : DEFAULT_DIRS
const [DIR_A = '', DIR_B = DIR_A] = DIRS
const OUT_DIR = process.env.ANVL_TECHPACK_OUT ?? tmpdir()

const PACKS: Array<{ label: string; path: string }> = [
  { label: 'compression-final', path: `${DIR_A}/ANVLAthletics_MenSeamlessCompressionTee_FinalPack_Jul022026 (1).pdf` },
  { label: 'compression-first', path: `${DIR_A}/ANVLAthletics_MenSeamlessCompressionTee_FirstPack_Jul022026.pdf` },
  { label: 'oversized-may20-final', path: `${DIR_B}/ANVLAthletics_MensOversizedDropShoulderTee_Updated_FinalPack_May202026 final.pdf` },
  { label: 'oversized-may26', path: `${DIR_B}/ANVLAthletics_MensOversizedDropShoulderTee_Updated_FinalPack_May262026.pdf` },
  { label: 'oversized-may15', path: `${DIR_B}/AVNLAthletics_MensOversizedDropShoulderTee_FinalPack_May152026.pdf` },
]

/** Point pdf.js at the on-disk worker; Vite's `?url` rewrite does not apply here. */
async function configureWorker(): Promise<void> {
  const pdfjs = await import('pdfjs-dist')
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const { pathToFileURL } = await import('node:url')
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href
  }
}

async function extractAll(path: string): Promise<TechpackPageExtract[]> {
  await configureWorker()
  const buf = readFileSync(path)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  const session = await openTechpackPdf(ab)
  const pages: TechpackPageExtract[] = []
  try {
    for (let n = 1; n <= session.pageCount; n += 1) {
      pages.push(await session.readPage(n))
      await session.releasePage(n)
    }
  } finally {
    await session.destroy()
  }
  return pages
}

const HAVE_PACKS = PACKS.some((pack) => existsSync(pack.path))

describe.skipIf(!HAVE_PACKS)('REAL PACKS', () => {
  for (const pack of PACKS) {
    it(
      `parses ${pack.label}`,
      async () => {
        const extracts = await extractAll(pack.path)
        const doc = buildTechpackDocument(extracts, { sourceFilename: pack.path.split('/').pop() })

        const report = {
          pack: pack.label,
          pages: doc.pages.map((p) => `${p.page}:${p.kind}`),
          header: doc.header,
          colorways: doc.colorways.map((c) => ({
            index: c.index,
            name: c.name,
            roles: c.roles.map((r) => `${r.role}|${r.colorName}|${r.pantone || r.coloro}|${r.hex}`),
          })),
          sizing: doc.sizing && {
            unit: doc.sizing.unit,
            sizes: doc.sizing.sizes,
            rows: doc.sizing.rows.map((r) => `${r.letter} ${r.label} [${r.rowKey}] ${JSON.stringify(r.values)}`),
            markers: doc.sizing.markers.map((m) => `${m.letter}x${m.positions.length}`),
          },
          blueprintPages: doc.blueprint.map((b) => ({
            page: b.page,
            features: b.features.map((f) => `${f.code}: ${f.label} :: ${f.detail}`),
          })),
          seams: doc.technical?.seams.map((s) => `${s.text} | code=${s.code} spi=${s.spi}`) ?? [],
          care: doc.packaging?.careLabel,
          images: doc.images.length,
          issues: doc.issues.map((i) => `${i.severity} p${i.page} ${i.code}: ${i.message}`),
        }

        writeFileSync(
          `${OUT_DIR}/report-${pack.label}.json`,
          JSON.stringify(report, null, 2),
        )
        // Pin seeds per blueprint page — percent of that page's flat region.
        doc.blueprint.forEach((b) => {
          const seeds = b.features.flatMap((f) => f.positions.map((pos) => ({ x: pos.x, y: pos.y })))
          writeFileSync(
            `${OUT_DIR}/seeds-${pack.label}-p${b.page}.json`,
            JSON.stringify(seeds, null, 1),
          )
        })

        // Raw geometry dump for diagnosis.
        writeFileSync(
          `${OUT_DIR}/raw-${pack.label}.json`,
          JSON.stringify(extracts.map((e) => ({
            page: e.page,
            viewport: e.viewport,
            items: e.items.map((i) => ({ s: i.str, x: Math.round(i.transform[4]*10)/10, y: Math.round((e.viewport.height - i.transform[5])*10)/10, w: Math.round(i.width*10)/10, h: Math.round(i.height*10)/10, a: Math.round(i.transform[0]*100)/100 })),
            images: e.images.map((im) => ({
              key: im.objectKey,
              px: im.width,
              py: im.height,
              x: Math.round(Math.min(im.ctm[4], im.ctm[4] + im.ctm[0]) * 10) / 10,
              y: Math.round((e.viewport.height - Math.min(im.ctm[5], im.ctm[5] + im.ctm[3]) - Math.abs(im.ctm[3])) * 10) / 10,
              w: Math.round(Math.abs(im.ctm[0]) * 10) / 10,
              h: Math.round(Math.abs(im.ctm[3]) * 10) / 10,
            })),
          })), null, 1),
        )
        expect(doc.pages.length).toBeGreaterThan(0)
      },
      180_000,
    )
  }
})
