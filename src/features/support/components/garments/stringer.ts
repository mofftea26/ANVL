import type { GarmentSchematic } from './types'

/**
 * Stringer — flat-lay, front face, symmetric about x = 230. Five points: no
 * sleeve, no cuff. Deep scooped armholes replace the tee's set-in sleeves, so
 * the drawing is narrower and the body-length dimension sits closer in.
 */
export const STRINGER_SCHEMATIC: GarmentSchematic = {
  key: 'stringer',
  label: 'Stringer',
  viewBox: { x: 128, y: 40, width: 318, height: 368 },
  outline:
    'M196 84 C204 122 256 122 264 84 L288 76 C272 108 292 140 310 168 L310 386 L150 386 L150 168 C168 140 188 108 172 76 Z',
  detail: [
    // Back neck tape.
    'M196 84 C204 70 256 70 264 84',
    // Strap seams.
    'M200 82 L285 74',
    // Hem stitch.
    'M150 374 L310 374',
    // Side seams.
    'M310 176 L310 386',
    'M150 176 L150 386',
  ],
  anchors: {
    length: {
      from: { x: 414, y: 80 },
      to: { x: 414, y: 386 },
      witness: [
        [
          { x: 292, y: 80 },
          { x: 424, y: 80 },
        ],
        [
          { x: 316, y: 386 },
          { x: 424, y: 386 },
        ],
      ],
      badge: { x: 414, y: 233 },
    },
    chest: {
      from: { x: 150, y: 178 },
      to: { x: 310, y: 178 },
    },
    waist: {
      from: { x: 150, y: 272 },
      to: { x: 310, y: 272 },
    },
    bottom: {
      from: { x: 150, y: 364 },
      to: { x: 310, y: 364 },
    },
    collar: {
      from: { x: 196, y: 58 },
      to: { x: 264, y: 58 },
      witness: [
        [
          { x: 196, y: 84 },
          { x: 196, y: 50 },
        ],
        [
          { x: 264, y: 84 },
          { x: 264, y: 50 },
        ],
      ],
    },
  },
}
