import { describe, expect, it } from 'vitest'
import QRCode from 'qrcode'
import { ANVL_CREST_VIEWBOX } from '@/shared/assets/brand/anvlCrestPath'
import {
  crestBox,
  crestPlateRect,
  fitCrestBox,
  isFinderModule,
  knockoutAreaRatio,
  knockoutBounds,
  moduleRadii,
  qrGeometry,
  renderAnvlQrBatch,
  PRINT_QR_COLORS,
  QR_CREST_BOX_RATIO,
  QR_FINDER_SIZE,
  QR_QUIET_MODULES,
  type QrMatrix,
} from '../qr/anvlQr'

const URL = 'https://www.anvlathletics.com/armory/george-maalouf'

/**
 * Real payloads: 49 modules is a passport `/p/<uuid>` URL at level H, 41 is the
 * public armory URL. Both were absent from the older fixtures, which is how a
 * knockout sized for a 37-module code went unmeasured at the counts that ship.
 */
const SHIPPING_MODULE_COUNTS = [21, 33, 41, 49]

function realMatrix(): QrMatrix {
  const code = QRCode.create(URL, { errorCorrectionLevel: 'H' })
  const size = code.modules.size
  const data = code.modules.data
  return { size, get: (row, col) => Boolean(data[row * size + col]) }
}

describe('qrGeometry', () => {
  it('reserves the quiet zone on every side', () => {
    const { cell, origin } = qrGeometry(1000, 37)
    expect(cell).toBeCloseTo(1000 / (37 + QR_QUIET_MODULES * 2))
    expect(origin).toBeCloseTo(cell * QR_QUIET_MODULES)
    // The code plus both quiet zones must fill the canvas exactly.
    expect(origin * 2 + cell * 37).toBeCloseTo(1000)
  })
})

describe('isFinderModule', () => {
  const count = 37

  it('claims all three finder corners and not the fourth', () => {
    expect(isFinderModule(0, 0, count)).toBe(true)
    expect(isFinderModule(0, count - 1, count)).toBe(true)
    expect(isFinderModule(count - 1, 0, count)).toBe(true)
    expect(isFinderModule(count - 1, count - 1, count)).toBe(false)
  })

  it('covers exactly 7×7 per corner', () => {
    expect(isFinderModule(QR_FINDER_SIZE - 1, QR_FINDER_SIZE - 1, count)).toBe(true)
    expect(isFinderModule(QR_FINDER_SIZE, QR_FINDER_SIZE, count)).toBe(false)
  })

  it('leaves the centre alone', () => {
    const mid = Math.floor(count / 2)
    expect(isFinderModule(mid, mid, count)).toBe(false)
  })
})

describe('knockoutBounds', () => {
  it('stays centred', () => {
    const count = 37
    const { from, to } = knockoutBounds(count)
    expect(from).toBe(count - 1 - to)
  })

  it('stays well inside the H-level error-correction budget', () => {
    // Level H recovers ~30% of the code. The crest must cost a fraction of it,
    // because masking and printing eat into the same budget.
    for (const count of [21, 25, 29, 33, 37, 41, 45, 49, 57]) {
      expect(knockoutAreaRatio(count)).toBeLessThan(0.1)
    }
  })

  it('never touches a finder pattern', () => {
    const count = 37
    const { from, to } = knockoutBounds(count)
    for (let row = from; row <= to; row += 1) {
      for (let col = from; col <= to; col += 1) {
        expect(isFinderModule(row, col, count)).toBe(false)
      }
    }
  })
})

describe('moduleRadii', () => {
  const matrix: QrMatrix = {
    size: 3,
    // A vertical pair in the middle column, plus an isolated corner module.
    get: (row, col) => (col === 1 && (row === 0 || row === 1)) || (row === 2 && col === 0),
  }

  it('rounds every corner of an isolated module', () => {
    const radii = moduleRadii(matrix, 2, 0, 4)
    expect(radii).toEqual({ tl: 4, tr: 4, br: 4, bl: 4 })
  })

  it('squares off the edge shared with a neighbour so runs fuse', () => {
    const top = moduleRadii(matrix, 0, 1, 4)
    expect(top.tl).toBe(4)
    expect(top.tr).toBe(4)
    // Its neighbour sits below — those corners must not curl away from it.
    expect(top.bl).toBe(0)
    expect(top.br).toBe(0)

    const bottom = moduleRadii(matrix, 1, 1, 4)
    expect(bottom.tl).toBe(0)
    expect(bottom.tr).toBe(0)
    expect(bottom.bl).toBe(4)
    expect(bottom.br).toBe(4)
  })
})

/**
 * Crest centring is pinned arithmetically, not by reading pixels: jsdom has no
 * 2D context, and a low-resolution pixel test would have passed with the bug
 * that shipped (the mark sat 8% of its own height — 10.45 px at size 1024 —
 * above the plate centre, because the caller hand-derived one of the two corner
 * offsets and got it wrong).
 */
describe('fitCrestBox', () => {
  const [, , vbW, vbH] = ANVL_CREST_VIEWBOX

  it('centres the mark on the given point, whatever the box shape', () => {
    for (const [maxW, maxH] of [
      [200, 200],
      [400, 200],
      [200, 400],
      [130.608, 130.608],
    ]) {
      const box = fitCrestBox(500, 400, maxW, maxH)
      expect(box.x + box.width / 2).toBeCloseTo(500, 9)
      expect(box.y + box.height / 2).toBeCloseTo(400, 9)
      // Contain, never cover: the mark may not spill out of the box.
      expect(box.width).toBeLessThanOrEqual(maxW + 1e-9)
      expect(box.height).toBeLessThanOrEqual(maxH + 1e-9)
    }
  })

  it('keeps the artwork aspect ratio and touches the limiting axis', () => {
    const box = fitCrestBox(0, 0, 200, 200)
    expect(box.width / box.height).toBeCloseTo(vbW / vbH, 9)
    // The crest is taller than wide, so a square box is filled by HEIGHT.
    expect(box.height).toBeCloseTo(200, 9)
    expect(box.width).toBeLessThan(200)
  })
})

describe('crestBox', () => {
  it('puts the knockout plate at the centre of the code', () => {
    for (const moduleCount of SHIPPING_MODULE_COUNTS) {
      const plate = crestPlateRect(1024, moduleCount)
      expect(plate.x + plate.width / 2).toBeCloseTo(512, 9)
      expect(plate.y + plate.height / 2).toBeCloseTo(512, 9)
      expect(plate.width).toBeCloseTo(plate.height, 9)
    }
  })

  it('sits dead centre in the plate at every size and version', () => {
    for (const size of [512, 742, 1024]) {
      for (const moduleCount of SHIPPING_MODULE_COUNTS) {
        const plate = crestPlateRect(size, moduleCount)
        const box = crestBox(size, moduleCount)
        // Half a pixel is the tolerance; the shipped bug was 10.45 px at 1024.
        expect(box.x + box.width / 2).toBeCloseTo(plate.x + plate.width / 2, 9)
        expect(box.y + box.height / 2).toBeCloseTo(plate.y + plate.height / 2, 9)
        expect(Math.abs(box.y + box.height / 2 - (plate.y + plate.height / 2))).toBeLessThan(0.5)
      }
    }
  })

  it('leaves equal air above and below the mark', () => {
    // The symptom of the old bug: the bottom gap was 1.495× the top gap.
    const plate = crestPlateRect(1024, 49)
    const box = crestBox(1024, 49)
    const above = box.y - plate.y
    const below = plate.y + plate.height - (box.y + box.height)
    expect(above).toBeCloseTo(below, 9)
  })

  it('stays inside the plate, with the side air a tall mark implies', () => {
    const plate = crestPlateRect(1024, 49)
    const box = crestBox(1024, 49)
    expect(box.x).toBeGreaterThan(plate.x)
    expect(box.y).toBeGreaterThan(plate.y)
    expect(box.x + box.width).toBeLessThan(plate.x + plate.width)
    expect(box.y + box.height).toBeLessThan(plate.y + plate.height)
    // Height is the limiting axis, so it is the box ratio that caps the mark.
    expect(box.height).toBeCloseTo(plate.height * QR_CREST_BOX_RATIO, 9)
  })
})

describe('renderAnvlQrBatch', () => {
  it('rejects when there is no 2D context, so the caller can report it', async () => {
    // Returning blank data URLs instead would leave the print sheet stuck on an
    // eternal skeleton with no way to tell the operator what went wrong.
    // (jsdom has no canvas backend, which is exactly the condition under test.)
    await expect(renderAnvlQrBatch([URL])).rejects.toThrow()
  })
})

describe('PRINT_QR_COLORS', () => {
  it('prints on the paper, not in a theme', () => {
    // The trap this guards: /admin wears the Studio palette (molten copper,
    // ember bronze), so resolving print colours from live CSS vars would print
    // bronze crests on an off-white tile. These are printer facts, not tokens.
    expect(PRINT_QR_COLORS.light).toBe('#FFFFFF')
    expect(PRINT_QR_COLORS.dark).toBe('#000000')
  })
})

describe('against a real payload', () => {
  it('produces a matrix whose finders and knockout do not overlap', () => {
    const matrix = realMatrix()
    const { from, to } = knockoutBounds(matrix.size)
    expect(to).toBeLessThan(matrix.size - QR_FINDER_SIZE)
    expect(from).toBeGreaterThan(QR_FINDER_SIZE)
  })
})
