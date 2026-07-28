import type { GarmentSchematic } from './types'

/**
 * Hoodie — flat-lay, front face, symmetric about x = 280. Same seven points as
 * the tee, but the hood occupies the space above the shoulders, so the neck
 * dimension is drawn INSIDE the body (below the collar) rather than above it.
 * That divergence is exactly why geometry is per-type rather than shared.
 */
export const HOODIE_SCHEMATIC: GarmentSchematic = {
  key: 'hoodie',
  label: 'Hoodie',
  viewBox: { x: 70, y: 58, width: 458, height: 352 },
  outline:
    'M248 112 C252 96 308 96 312 112 L374 104 L458 154 L430 212 L388 188 L388 392 L172 392 L172 188 L130 212 L102 154 L186 104 Z',
  detail: [
    // Hood, outer then inner edge.
    'M248 112 C234 66 326 66 312 112',
    'M255 106 C244 78 316 78 305 106',
    // Kangaroo pocket.
    'M206 262 L198 318 L362 318 L354 262',
    // Ribbed hem band.
    'M172 368 L388 368',
    // Ribbed cuffs.
    'M447 142 L419 200',
    'M113 142 L141 200',
  ],
  anchors: {
    length: {
      from: { x: 500, y: 112 },
      to: { x: 500, y: 392 },
      witness: [
        [
          { x: 462, y: 112 },
          { x: 510, y: 112 },
        ],
        [
          { x: 394, y: 392 },
          { x: 510, y: 392 },
        ],
      ],
      badge: { x: 500, y: 252 },
    },
    chest: {
      from: { x: 172, y: 212 },
      to: { x: 388, y: 212 },
    },
    waist: {
      from: { x: 172, y: 344 },
      to: { x: 388, y: 344 },
    },
    bottom: {
      from: { x: 172, y: 380 },
      to: { x: 388, y: 380 },
    },
    collar: {
      from: { x: 248, y: 148 },
      to: { x: 312, y: 148 },
      witness: [
        [
          { x: 248, y: 112 },
          { x: 248, y: 154 },
        ],
        [
          { x: 312, y: 112 },
          { x: 312, y: 154 },
        ],
      ],
    },
    sleeve: {
      from: { x: 384, y: 87 },
      to: { x: 468, y: 137 },
      witness: [
        [
          { x: 374, y: 104 },
          { x: 387, y: 82 },
        ],
        [
          { x: 458, y: 154 },
          { x: 471, y: 132 },
        ],
      ],
      badge: { x: 426, y: 112 },
    },
    cuff: {
      from: { x: 114, y: 220 },
      to: { x: 86, y: 162 },
      witness: [
        [
          { x: 130, y: 212 },
          { x: 110, y: 222 },
        ],
        [
          { x: 102, y: 154 },
          { x: 82, y: 164 },
        ],
      ],
      badge: { x: 100, y: 191 },
    },
  },
}
