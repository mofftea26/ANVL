import type { GarmentSchematic } from './types'

/**
 * Joggers — flat-lay, front face, symmetric about x = 230, crotch at y = 300.
 * Four points and no chest, collar or sleeve. `length` is the INSEAM here, so
 * it is drawn from the crotch down, not from a shoulder. `bottom` (leg
 * opening) is taken at the left hem and `cuff` across the right rib band —
 * two genuinely different places on the garment, drawn where each one is.
 */
export const JOGGERS_SCHEMATIC: GarmentSchematic = {
  key: 'joggers',
  label: 'Joggers',
  viewBox: { x: 54, y: 28, width: 300, height: 546 },
  outline:
    'M132 70 L328 70 L340 200 L320 520 L248 520 L230 300 L212 520 L140 520 L120 200 Z',
  detail: [
    // Waistband.
    'M132 96 L328 96',
    // Front rise / centre fold.
    'M230 96 L230 300',
    // Ribbed ankle cuffs.
    'M143 494 L211 494',
    'M249 494 L317 494',
  ],
  anchors: {
    length: {
      from: { x: 76, y: 300 },
      to: { x: 76, y: 520 },
      witness: [
        [
          { x: 126, y: 300 },
          { x: 68, y: 300 },
        ],
        [
          { x: 140, y: 520 },
          { x: 68, y: 520 },
        ],
      ],
      badge: { x: 76, y: 410 },
    },
    waist: {
      from: { x: 132, y: 48 },
      to: { x: 328, y: 48 },
      witness: [
        [
          { x: 132, y: 70 },
          { x: 132, y: 40 },
        ],
        [
          { x: 328, y: 70 },
          { x: 328, y: 40 },
        ],
      ],
    },
    bottom: {
      from: { x: 140, y: 550 },
      to: { x: 212, y: 550 },
      witness: [
        [
          { x: 140, y: 520 },
          { x: 140, y: 558 },
        ],
        [
          { x: 212, y: 520 },
          { x: 212, y: 558 },
        ],
      ],
    },
    cuff: {
      from: { x: 247, y: 507 },
      to: { x: 321, y: 507 },
    },
  },
}
