import { describe, expect, it } from 'vitest'

import {
  assignToColumn,
  boxCenter,
  buildColumnGrid,
  clusterRows,
  imagePlacementBox,
  isAxisAligned,
  itemBox,
  joinRow,
  median,
  pageBoxToImagePercent,
  toPlacedText,
  unionBox,
  type Box,
  type PlacedText,
} from '../geometry'
import { makeExtract } from './fixtures/makeExtract'

const placed = (text: string, box: Box, fontSize = box.h): PlacedText => ({
  text,
  box,
  fontSize,
})

describe('itemBox', () => {
  it('flips PDF bottom-up space into top-left space', () => {
    const extract = makeExtract({
      height: 700,
      texts: [{ text: 'TOP', x: 10, y: 0, h: 10 }],
    })
    const box = itemBox(extract.items[0]!, 700)
    expect(box.x).toBe(10)
    expect(box.y).toBeCloseTo(0)
    expect(box.h).toBe(10)
  })

  it('places a lower item further down the page', () => {
    const extract = makeExtract({
      height: 700,
      texts: [
        { text: 'TOP', x: 10, y: 50, h: 10 },
        { text: 'BOTTOM', x: 10, y: 600, h: 10 },
      ],
    })
    const top = itemBox(extract.items[0]!, 700)
    const bottom = itemBox(extract.items[1]!, 700)
    expect(top.y).toBeCloseTo(50)
    expect(bottom.y).toBeCloseTo(600)
    expect(bottom.y).toBeGreaterThan(top.y)
  })

  it('falls back to the reported height when the matrix scale is zero', () => {
    const box = itemBox(
      {
        str: 'X',
        transform: [0, 0, 0, 0, 5, 690],
        width: 6,
        height: 10,
        fontName: 'f',
        hasEOL: false,
      },
      700,
    )
    expect(box.h).toBe(10)
    expect(box.y).toBeCloseTo(0)
  })
})

describe('imagePlacementBox', () => {
  it('converts a placement matrix to a top-left box', () => {
    const extract = makeExtract({
      height: 700,
      images: [{ key: 'img1', x: 100, y: 200, w: 300, h: 400 }],
    })
    expect(imagePlacementBox(extract.images[0]!, 700)).toEqual({
      x: 100,
      y: 200,
      w: 300,
      h: 400,
    })
  })

  it('handles a vertically flipped placement', () => {
    // Producers routinely place images with a negative vertical scale to map a
    // top-down bitmap into bottom-up user space. Reading `f` as the corner
    // would put the box a full image-height off.
    const flipped = imagePlacementBox(
      { objectKey: 'flip', ctm: [300, 0, 0, -400, 100, 600], width: 300, height: 400 },
      700,
    )
    expect(flipped).toEqual({ x: 100, y: 100, w: 300, h: 400 })
  })

  it('detects rotation/skew', () => {
    const extract = makeExtract({
      images: [{ key: 'img1', x: 0, y: 0, w: 10, h: 10 }],
    })
    expect(isAxisAligned(extract.images[0]!)).toBe(true)
    expect(
      isAxisAligned({ objectKey: 'r', ctm: [10, 0.5, -0.5, 10, 0, 0], width: 10, height: 10 }),
    ).toBe(false)
  })
})

describe('clusterRows', () => {
  it('groups items sharing a baseline and sorts each row left to right', () => {
    const rows = clusterRows([
      placed('C', { x: 300, y: 100, w: 20, h: 10 }),
      placed('A', { x: 10, y: 100, w: 20, h: 10 }),
      placed('B', { x: 150, y: 102, w: 20, h: 10 }),
      placed('D', { x: 10, y: 200, w: 20, h: 10 }),
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0]!.map((i) => i.text)).toEqual(['A', 'B', 'C'])
    expect(rows[1]!.map((i) => i.text)).toEqual(['D'])
  })

  it('does not split a row when one cell is slightly taller', () => {
    // The running-mean comparison exists for exactly this: a drifting
    // first-element baseline is what mangles the supplied sizing tables.
    const rows = clusterRows([
      placed('a', { x: 0, y: 100, w: 10, h: 8 }),
      placed('b', { x: 40, y: 99, w: 10, h: 10 }),
      placed('c', { x: 80, y: 101, w: 10, h: 8 }),
      placed('d', { x: 120, y: 100.5, w: 10, h: 9 }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveLength(4)
  })

  it('keeps genuinely separate rows apart', () => {
    const rows = clusterRows([
      placed('a', { x: 0, y: 100, w: 10, h: 8 }),
      placed('b', { x: 0, y: 112, w: 10, h: 8 }),
      placed('c', { x: 0, y: 124, w: 10, h: 8 }),
    ])
    expect(rows).toHaveLength(3)
  })

  it('returns nothing for no input', () => {
    expect(clusterRows([])).toEqual([])
  })
})

describe('buildColumnGrid / assignToColumn', () => {
  const headers = [
    placed('SMALL', { x: 100, y: 10, w: 40, h: 8 }),
    placed('MEDIUM', { x: 200, y: 10, w: 40, h: 8 }),
    placed('LARGE', { x: 300, y: 10, w: 40, h: 8 }),
    placed('X-LARGE', { x: 400, y: 10, w: 40, h: 8 }),
  ]
  const grid = buildColumnGrid(headers)

  it('derives evenly spaced column centres', () => {
    expect(grid.centers).toEqual([120, 220, 320, 420])
    expect(grid.width).toBe(100)
  })

  it('assigns a cell to its nearest column', () => {
    expect(assignToColumn({ x: 205, y: 40, w: 30, h: 8 }, grid)).toBe(1)
    expect(assignToColumn({ x: 405, y: 40, w: 30, h: 8 }, grid)).toBe(3)
  })

  it('refuses a cell stranded between two columns', () => {
    // Refusing beats guessing: a mis-assigned cell writes a wrong number into
    // a public size chart and looks entirely plausible.
    // Centre 165 is 45 from column 0 — 45% of a 100-wide column, past the 0.35 gate.
    expect(assignToColumn({ x: 160, y: 40, w: 10, h: 8 }, grid)).toBeNull()
  })

  it('still accepts a cell sitting close to its column centre', () => {
    expect(assignToColumn({ x: 210, y: 40, w: 20, h: 8 }, grid)).toBe(1)
  })

  it('cannot reject anything at a 0.5 factor, which is why 0.35 is the default', () => {
    // Documents the trap: in an evenly spaced grid the worst-case distance to
    // the nearest centre IS half a column, so 0.5 is a no-op guard.
    expect(assignToColumn({ x: 160, y: 40, w: 10, h: 8 }, grid, 0.5)).toBe(0)
  })

  it('handles a single-column grid', () => {
    const single = buildColumnGrid([placed('ONLY', { x: 0, y: 0, w: 50, h: 8 })])
    expect(single.centers).toEqual([25])
    expect(assignToColumn({ x: 10, y: 0, w: 20, h: 8 }, single)).toBe(0)
  })
})

describe('pageBoxToImagePercent', () => {
  const flat: Box = { x: 200, y: 100, w: 400, h: 500 }

  it('maps a point inside the flat to a percentage of it', () => {
    expect(pageBoxToImagePercent({ x: 400, y: 350 }, flat)).toEqual({ x: 50, y: 50 })
    expect(pageBoxToImagePercent({ x: 200, y: 100 }, flat)).toEqual({ x: 0, y: 0 })
    expect(pageBoxToImagePercent({ x: 600, y: 600 }, flat)).toEqual({ x: 100, y: 100 })
  })

  it('clamps points outside the flat', () => {
    expect(pageBoxToImagePercent({ x: 0, y: 0 }, flat)).toEqual({ x: 0, y: 0 })
    expect(pageBoxToImagePercent({ x: 5000, y: 5000 }, flat)).toEqual({ x: 100, y: 100 })
  })

  it('falls back to the centre for a degenerate box', () => {
    expect(pageBoxToImagePercent({ x: 10, y: 10 }, { x: 0, y: 0, w: 0, h: 0 })).toEqual({
      x: 50,
      y: 50,
    })
  })
})

describe('joinRow', () => {
  it('joins letter-spaced glyphs into one word', () => {
    // Techpack headings are letter-spaced; joining on token boundaries would
    // produce "C O L O R W A Y S" and match nothing.
    const glyphs = 'COLORWAYS'.split('').map((ch, i) => placed(ch, { x: i * 7, y: 0, w: 6, h: 8 }))
    expect(joinRow(glyphs)).toBe('COLORWAYS')
  })

  it('inserts a space at a real word gap', () => {
    expect(
      joinRow([
        placed('BASIC', { x: 0, y: 0, w: 40, h: 10 }),
        placed('SPECS', { x: 60, y: 0, w: 40, h: 10 }),
      ]),
    ).toBe('BASIC SPECS')
  })

  it('sorts out-of-order runs by x', () => {
    expect(
      joinRow([
        placed('SECOND', { x: 100, y: 0, w: 40, h: 10 }),
        placed('FIRST', { x: 0, y: 0, w: 40, h: 10 }),
      ]),
    ).toBe('FIRST SECOND')
  })

  // Every box below is copied verbatim from the raw geometry of the operator's
  // packs, because the bug only shows at their real proportions: these are
  // condensed faces where the word space is far narrower than the font height.
  it('spaces a cross-reference that the height-based rule welded shut', () => {
    // oversized-may20-final page 7. Gap is 2.3 pt = 0.29 of the 8 pt height but
    // 0.42 of a character advance — the old 0.32-of-height rule read it as no
    // gap at all, and `splitSupplierRef` then could not find "(SEE GRAPHIC B)".
    expect(
      joinRow([
        placed('(SEE', { x: 36.6, y: 217.3, w: 22.1, h: 8 }),
        placed('GRAPHIC B', { x: 61, y: 217.3, w: 49.5, h: 8 }),
        placed(')', { x: 110.5, y: 217.3, w: 3.6, h: 8 }),
      ]),
    ).toBe('(SEE GRAPHIC B)')
  })

  it('spaces the smallest real word gap in the packs', () => {
    // oversized-may20-final page 6: the tightest genuine word gap measured
    // anywhere in the five packs — 1.8 pt, only 0.31 of the 5.88 pt height.
    expect(
      joinRow([
        placed('APPLICATION (SEE', { x: 600.7, y: 219.5, w: 63.2, h: 5.88 }),
        placed('TRIM A', { x: 665.7, y: 219.5, w: 22.6, h: 5.88 }),
        placed(')', { x: 688.3, y: 219.5, w: 2.7, h: 5.88 }),
      ]),
    ).toBe('APPLICATION (SEE TRIM A)')
  })

  it('spaces a measurement label from its point code', () => {
    // compression-final page 2 sizing table: "1/2 CUFF WIDTH - G", which the
    // old rule joined into "WIDTH- G".
    expect(
      joinRow([
        placed('WIDTH', { x: 62.7, y: 401.5, w: 30.8, h: 8 }),
        placed('- G', { x: 95.8, y: 401.5, w: 12.2, h: 8 }),
      ]),
    ).toBe('WIDTH - G')
  })

  it('keeps a closing bracket welded to its label', () => {
    // The other direction: `GRAPHIC B` ends at 110.5 and `)` starts at 110.5,
    // so a rule loose enough to split this would break every bracketed
    // cross-reference on the page.
    expect(
      joinRow([
        placed('GRAPHIC B', { x: 61, y: 217.3, w: 49.5, h: 8 }),
        placed(')', { x: 110.5, y: 217.3, w: 3.6, h: 8 }),
      ]),
    ).toBe('GRAPHIC B)')
  })

  it('still reassembles the letter-spaced page heading', () => {
    // Page classification depends on this. compression-final page 1 sets the
    // heading as ONE run whose glyphs are tracked apart, so the collapse in
    // `toPlacedText` does the work and `joinRow` must not undo it.
    const extract = makeExtract({
      width: 841.89,
      height: 595.276,
      texts: [{ text: 'C O L O R W AY S :', x: 217.5, y: 30.1, w: 66.8, h: 7 }],
    })
    expect(joinRow(toPlacedText(extract))).toBe('COLORWAYS:')
  })
})

describe('misc box helpers', () => {
  it('computes medians for even and odd counts', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBe(0)
  })

  it('unions boxes and returns null for none', () => {
    expect(unionBox([{ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 5, w: 10, h: 10 }])).toEqual({
      x: 0,
      y: 0,
      w: 30,
      h: 15,
    })
    expect(unionBox([])).toBeNull()
  })

  it('centres a box', () => {
    expect(boxCenter({ x: 10, y: 20, w: 30, h: 40 })).toEqual({ x: 25, y: 40 })
  })
})

describe('toPlacedText', () => {
  it('drops blank runs and normalizes whitespace', () => {
    const extract = makeExtract({
      texts: [
        { text: '  ', x: 0, y: 0 },
        { text: '  SPACED   OUT ', x: 10, y: 20 },
      ],
    })
    const placedText = toPlacedText(extract)
    expect(placedText).toHaveLength(1)
    expect(placedText[0]!.text).toBe('SPACED OUT')
  })
})
