import type { GarmentSchematic } from './types'

/**
 * Shorts — flat-lay, front face, symmetric about x = 230, crotch at y = 240.
 * Three points: inseam length, waist, leg opening. No chest, collar, sleeve
 * or cuff.
 */
export const SHORTS_SCHEMATIC: GarmentSchematic = {
  key: 'shorts',
  label: 'Shorts',
  viewBox: { x: 50, y: 28, width: 304, height: 356 },
  outline:
    'M132 70 L328 70 L344 190 L336 330 L250 330 L230 240 L210 330 L124 330 L116 190 Z',
  detail: [
    // Waistband.
    'M132 96 L328 96',
    // Front rise / centre fold.
    'M230 96 L230 240',
    // Hem stitch, one per leg.
    'M124 316 L210 316',
    'M250 316 L336 316',
  ],
  anchors: {
    length: {
      from: { x: 72, y: 240 },
      to: { x: 72, y: 330 },
      witness: [
        [
          { x: 119, y: 240 },
          { x: 64, y: 240 },
        ],
        [
          { x: 124, y: 330 },
          { x: 64, y: 330 },
        ],
      ],
      badge: { x: 72, y: 285 },
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
      from: { x: 124, y: 360 },
      to: { x: 210, y: 360 },
      witness: [
        [
          { x: 124, y: 330 },
          { x: 124, y: 368 },
        ],
        [
          { x: 210, y: 330 },
          { x: 210, y: 368 },
        ],
      ],
    },
  },
}
