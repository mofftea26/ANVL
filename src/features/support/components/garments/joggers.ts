import type { GarmentSchematic } from './types'

/**
 * Joggers — flat-lay, front face, symmetric about x = 230, crotch at y = 290.
 * Four points and no chest, collar or sleeve. `length` is the INSEAM here, so
 * it is drawn from the crotch down, not from a shoulder. `bottom` (leg
 * opening) is taken below the left hem and `cuff` across the right rib band —
 * two genuinely different places on the garment, drawn where each one is.
 *
 * The viewBox is deliberately wider than the drawing needs. Every schematic
 * renders into the same `w-full max-h-[26rem]` box under
 * `preserveAspectRatio="meet"`, so a much taller aspect ratio would letterbox
 * this one to roughly two thirds the width of the other four and read as a
 * broken panel. Padding the box to an aspect ratio in family (~0.88) keeps the
 * rendered frame identical across garment types; the legs are also drawn
 * shorter than life so the garment itself stays a usable size inside it.
 */
export const JOGGERS_SCHEMATIC: GarmentSchematic = {
  key: 'joggers',
  label: 'Joggers',
  viewBox: { x: -10, y: 28, width: 420, height: 482 },
  outline:
    'M132 70 L328 70 L340 190 L320 460 L248 460 L230 290 L212 460 L140 460 L120 190 Z',
  detail: [
    // Waistband.
    'M132 96 L328 96',
    // Front rise / centre fold.
    'M230 96 L230 290',
    // Ribbed ankle cuffs, spanning each leg at y = 436.
    'M138.2 436 L214.5 436',
    'M245.5 436 L321.8 436',
  ],
  anchors: {
    length: {
      from: { x: 76, y: 290 },
      to: { x: 76, y: 460 },
      witness: [
        [
          { x: 127.4, y: 290 },
          { x: 68, y: 290 },
        ],
        [
          { x: 140, y: 460 },
          { x: 68, y: 460 },
        ],
      ],
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
      from: { x: 140, y: 490 },
      to: { x: 212, y: 490 },
      witness: [
        [
          { x: 140, y: 460 },
          { x: 140, y: 498 },
        ],
        [
          { x: 212, y: 460 },
          { x: 212, y: 498 },
        ],
      ],
    },
    /**
     * Offset ABOVE the rib band with leaders running back down to it. Drawn on
     * the band itself, the default midpoint badge straddled the hem: the band
     * spans y 436–460, so a 15-unit active disc centred on it would overhang
     * the silhouette and blank the very rib line the measurement identifies.
     */
    cuff: {
      from: { x: 245.5, y: 414 },
      to: { x: 321.8, y: 414 },
      witness: [
        [
          { x: 245.5, y: 436 },
          { x: 245.5, y: 406 },
        ],
        [
          { x: 321.8, y: 436 },
          { x: 321.8, y: 406 },
        ],
      ],
    },
  },
}
