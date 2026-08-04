import { describe, expect, it } from 'vitest'

import { buildTechpackDocument, techpackIssueCount } from '../buildDocument'
import type { TechpackPageExtract } from '../pdfTypes'
import { basicSpecsPage } from './fixtures/basicSpecsPage'
import { headerTexts, makeExtract, titleTexts } from './fixtures/makeExtract'
import { sizingGuidePage } from './fixtures/sizingPage'

/** A minimal page of a given kind, carrying the shared header block. */
function page(
  pageNumber: number,
  title: [string, string],
  body: Array<{ text: string; x: number; y: number; w?: number; h?: number }> = [],
  fabric?: string,
): TechpackPageExtract {
  return makeExtract({
    page: pageNumber,
    texts: [
      ...headerTexts(fabric ? { fabric } : {}),
      ...titleTexts(title[0], title[1]),
      ...body.map((b) => ({ h: 8, ...b })),
    ],
  })
}

/** The oversized-tee pack: cotton, three colorways, care label set as text. */
function oversizedTeePack(): TechpackPageExtract[] {
  return [
    page(1, ['COLORWAY', 'SCHEDULE'], [
      // The role label is set SMALLER than the block and to its left, level
      // with the middle of the stack — the layout every supplied pack uses.
      { text: 'MAIN', x: 39, y: 252, w: 11, h: 5 },
      { text: 'PANTONE COLOR CODE:', x: 60, y: 240, w: 120 },
      { text: '18-0202 TCX', x: 60, y: 254, w: 70 },
      { text: 'LAVA SMOKE', x: 60, y: 268, w: 70 },
      { text: 'sRGB (94/96/100)', x: 60, y: 282, w: 90 },
    ]),
    sizingGuidePage(),
    page(3, ['TECHNICAL', 'SHEET'], [
      {
        text: 'PLAIN SEAM W/ 15SPI S/N 301 LOCKSTITCH - 1/4" STITCH LINE (SSa [1.01.01]) (SEE DETAIL K)',
        x: 300,
        y: 200,
        w: 420,
      },
      { text: '24.00', x: 300, y: 300, w: 30 },
      { text: 'SCALE: 1:10', x: 300, y: 330, w: 60 },
    ]),
    basicSpecsPage(),
    page(5, ['PACKAGING', 'AND LABELS'], [
      { text: '100% COTTON', x: 100, y: 300, w: 70 },
      { text: 'COOL WASH INSIDE OUT', x: 100, y: 320, w: 120 },
      { text: 'USE MILD DETERGENT', x: 100, y: 340, w: 110 },
      { text: 'DO NOT TUMBLE DRY', x: 100, y: 360, w: 110 },
      { text: 'DO NOT DRY CLEAN', x: 100, y: 380, w: 110 },
      { text: 'Designed in Lebanon', x: 100, y: 400, w: 110 },
      { text: '1.875"X1.25" (VISIBLE)', x: 100, y: 420, w: 120 },
    ]),
  ]
}

describe('buildTechpackDocument', () => {
  const doc = buildTechpackDocument(oversizedTeePack(), {
    sourceFilename: 'ANVLAthletics_MensOversizedTee_FinalPack.pdf',
    parsedAt: '2026-07-29T00:00:00.000Z',
  })

  it('classifies every page', () => {
    expect(doc.pages.map((p) => p.kind)).toEqual([
      'colorway-schedule',
      'sizing-guide',
      'technical-sheet',
      'basic-specs',
      'packaging-and-labels',
    ])
  })

  it('votes the header across pages', () => {
    expect(doc.header.product).toBe('MENS OVERSIZED TEE')
    expect(doc.header.style).toBe('ANVL-M-SS01-FW26')
    expect(doc.header.colorwayCount).toBe(3)
    expect(doc.header.fabric.gsm).toBe(260)
    expect(doc.header.fabric.composition).toEqual([{ material: 'COTTON', percentage: 100 }])
  })

  it('assembles each section from its own page', () => {
    expect(doc.sizing?.rows).toHaveLength(7)
    expect(doc.blueprint).toHaveLength(1)
    expect(doc.blueprint[0]?.features).toHaveLength(12)
    expect(doc.technical?.seams.length).toBeGreaterThan(0)
    expect(doc.packaging?.careLabel.textAvailable).toBe(true)
    expect(doc.packaging?.careLabel.origin).toBe('Lebanon')
  })

  it('reads the care instructions off the label', () => {
    expect(doc.packaging?.careLabel.lines).toContain('100% COTTON')
    expect(doc.packaging?.careLabel.lines).toContain('DO NOT TUMBLE DRY')
    expect(doc.packaging?.careLabel.lines).toContain('DO NOT DRY CLEAN')
  })

  it('keeps stitch detail but holds pattern dimensions internally', () => {
    // Both live on the technical sheet; only one of them is disclosable.
    const seam = doc.technical?.seams[0]
    expect(seam?.spi).toBe(15)
    expect(seam?.code).toBe('SSa [1.01.01]')
    expect(seam?.supplierRef).toBe('SEE DETAIL K')
    expect(doc.technical?.patternPieces.length).toBeGreaterThan(0)
  })

  it('catalogues extracted images and tags their roles', () => {
    const diagram = doc.images.find((i) => i.id === doc.sizing?.diagramImageId)
    expect(diagram?.role).toBe('garment-flat')
    expect(diagram?.page).toBe(4)
    // The blueprint nominates no image at all: nothing on a BASIC SPECS page
    // IS the garment drawing, and the crop that used to stand in for it is
    // gone. Only the sizing diagram carries the `garment-flat` role now.
    const flats = doc.images.filter((i) => i.role === 'garment-flat')
    expect(flats.map((i) => i.id)).toEqual([doc.sizing?.diagramImageId])
    expect(doc.blueprint[0]?.features.length).toBeGreaterThan(0)
  })

  it('records provenance and strips the supplier from the filename', () => {
    expect(doc.meta.pageCount).toBe(5)
    expect(doc.meta.parserVersion).toBeTruthy()
    expect(doc.meta.sourceFilename).toBe('anvlathletics-mensoversizedtee-finalpack.pdf')
  })

  it('lets no disclaimer through any gate', () => {
    // Gate 2 exists because a phrase split across several text runs matches
    // none of them individually — only the assembled document.
    const serialized = JSON.stringify(doc).toLowerCase()
    expect(serialized).not.toContain('fittdesign')
    expect(serialized).not.toContain('not liable')
    expect(serialized).not.toContain('disclaimer')
    expect(serialized).not.toContain('please sample')
  })

  it('parses cleanly enough to import', () => {
    expect(techpackIssueCount(doc)).toBe(0)
  })
})

describe('buildTechpackDocument — packs that differ', () => {
  it('leaves absent sections empty rather than missing', () => {
    // The compression pack has no trims and no printed graphics; the oversized
    // pack has no knit textures. Neither should look like a parse failure.
    const doc = buildTechpackDocument(oversizedTeePack())
    expect(doc.trims).toEqual([])
    expect(doc.knits).toEqual([])
    expect(doc.prints).toEqual([])
    expect(doc.swatches).toEqual([])
  })

  it('flags a care label that exists only as artwork', () => {
    // The seamless pack heat-transfers its care label, so the wording is not
    // in the text layer at all. Saying so beats publishing an empty section.
    const doc = buildTechpackDocument([
      page(1, ['PACKAGING', 'AND LABELS'], [
        { text: 'PRINTED CARE / BRAND LABEL (GRAPHIC A):', x: 100, y: 300, w: 200 },
        { text: '2.00"X2.00"', x: 100, y: 320, w: 70 },
        { text: 'CUSTOM BRAND / SIZE LABEL', x: 100, y: 340, w: 150 },
      ]),
    ])
    expect(doc.packaging?.careLabel.textAvailable).toBe(false)
    expect(doc.packaging?.careLabel.lines).toEqual([])
    expect(doc.issues.some((i) => i.code === 'care_label_image_only')).toBe(true)
  })

  it('reads a multi-fibre fabric line', () => {
    const doc = buildTechpackDocument([
      page(
        1,
        ['SIZING', 'GUIDE'],
        [],
        'FABRIC: 73% NYLON | 21% POLYESTER | 6% SPANDEX | 330 GSM | SINGLE JERSEY WEFT KNIT',
      ),
    ])
    expect(doc.header.fabric.gsm).toBe(330)
    expect(doc.header.fabric.composition).toEqual([
      { material: 'NYLON', percentage: 73 },
      { material: 'POLYESTER', percentage: 21 },
      { material: 'SPANDEX', percentage: 6 },
    ])
  })
})

describe('buildTechpackDocument — a template we do not know', () => {
  it('fails loudly rather than returning a plausible-looking empty document', () => {
    // The dangerous failure is not a crash, it is a document that merely looks
    // sparse — an operator would publish that without a second thought.
    const foreign = [1, 2, 3, 4].map((n) =>
      makeExtract({
        page: n,
        texts: [{ text: 'SOMETHING ENTIRELY ELSE', x: 100, y: 300, w: 200, h: 10 }],
      }),
    )
    const doc = buildTechpackDocument(foreign)
    const alarm = doc.issues.find((i) => i.code === 'template_not_recognised')
    expect(alarm).toBeDefined()
    expect(alarm?.severity).toBe('error')
    expect(techpackIssueCount(doc)).toBeGreaterThan(0)
  })

  it('isolates a page that throws so the rest still parses', () => {
    const pages = oversizedTeePack()
    // A page with a size heading but nothing else is enough to exercise the
    // guard without depending on any particular parser crashing.
    pages.push(page(9, ['SIZING', 'GUIDE'], [{ text: 'SMALL', x: 300, y: 200 }]))
    const doc = buildTechpackDocument(pages)
    expect(doc.blueprint[0]?.features).toHaveLength(12)
    expect(doc.sizing?.rows).toHaveLength(7)
  })
})
