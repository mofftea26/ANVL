import type { GarmentSchematic } from './types'

/**
 * Tee — flat-lay, front face, symmetric about x = 280. Carries all seven
 * measurement points. The body-length dimension sits clear of the sleeve on
 * the right; the three width dimensions stack into a single centre column so
 * the drawing reads as one spec sheet rather than scattered arrows.
 */
export const TEE_SCHEMATIC: GarmentSchematic = {
  key: 'tee',
  label: 'Tee',
  viewBox: { x: 76, y: 44, width: 450, height: 366 },
  outline:
    'M252 94 C258 118 302 118 308 94 L370 88 L452 138 L424 196 L380 172 L380 390 L180 390 L180 172 L136 196 L108 138 L190 88 Z',
  detail: [
    // Back neck tape.
    'M252 94 C258 84 302 84 308 94',
    // Armhole seams.
    'M370 88 L380 172',
    'M190 88 L180 172',
    // Hem stitch.
    'M180 376 L380 376',
    // Sleeve hem stitch.
    'M444 143 L419 194',
    'M116 143 L141 194',
  ],
  anchors: {
    length: {
      from: { x: 496, y: 94 },
      to: { x: 496, y: 390 },
      witness: [
        [
          { x: 458, y: 94 },
          { x: 506, y: 94 },
        ],
        [
          { x: 386, y: 390 },
          { x: 506, y: 390 },
        ],
      ],
      badge: { x: 496, y: 242 },
    },
    chest: {
      from: { x: 180, y: 196 },
      to: { x: 380, y: 196 },
    },
    waist: {
      from: { x: 180, y: 290 },
      to: { x: 380, y: 290 },
    },
    bottom: {
      from: { x: 180, y: 364 },
      to: { x: 380, y: 364 },
    },
    collar: {
      from: { x: 252, y: 72 },
      to: { x: 308, y: 72 },
      witness: [
        [
          { x: 252, y: 94 },
          { x: 252, y: 64 },
        ],
        [
          { x: 308, y: 94 },
          { x: 308, y: 64 },
        ],
      ],
    },
    sleeve: {
      from: { x: 380, y: 71 },
      to: { x: 462, y: 121 },
      witness: [
        [
          { x: 370, y: 88 },
          { x: 383, y: 66 },
        ],
        [
          { x: 452, y: 138 },
          { x: 465, y: 116 },
        ],
      ],
      badge: { x: 421, y: 96 },
    },
    cuff: {
      from: { x: 120, y: 204 },
      to: { x: 92, y: 146 },
      witness: [
        [
          { x: 136, y: 196 },
          { x: 116, y: 206 },
        ],
        [
          { x: 108, y: 138 },
          { x: 88, y: 148 },
        ],
      ],
      badge: { x: 106, y: 175 },
    },
  },
}
