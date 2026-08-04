import { describe, expect, it } from 'vitest'
import type { PassportEffectMarker } from '../../effectFacts'
import { buildFitLayout, FIT_TYPE, FIT_VIEW_W, readoutScale } from '../fitLayout'

/**
 * The Fit stage's TYPE, pinned.
 *
 * Sizing used to happen once per band, inside the same function that placed
 * the readout — so three tapes measuring one garment could come out at three
 * different sizes, and a cramped one could land smaller than the decorative
 * S · M · L · XL whisper beneath it. Nothing failed; it just looked like an
 * accident, which it was. The scale is a stage decision now, and these numbers
 * are the thing a reviewer cannot re-derive by reading the code, so they are
 * asserted rather than trusted.
 *
 * No React and no DOM here: the solver is pure, and `rect: null` +
 * `profile: null` is the designed fallback geometry (a 13% garment inset on
 * the 400×500 stage), which is what makes these numbers round.
 */

const marker = (label: string, value: string, y: number): PassportEffectMarker => ({
  label,
  value,
  x: 50,
  y,
})

const MEASURED = [
  marker('Chest', '52 cm', 30),
  marker('Waist', '48 cm', 52),
  marker('Hem', '50.5 cm', 74),
]

const layout = (fit: PassportEffectMarker[], tier: 'console' | 'sheet' = 'console') =>
  buildFitLayout(null, null, tier, fit)

/** The readouts that actually carry text — the only ones that can disagree. */
const readouts = (fit: PassportEffectMarker[], tier: 'console' | 'sheet' = 'console') =>
  layout(fit, tier).bands.filter((b) => b.fact !== null)

describe('fitLayout — the stage type scale', () => {
  it('draws every reading at one size, and every term at one size', () => {
    const bands = readouts(MEASURED)
    expect(bands).toHaveLength(3)
    expect(bands.map((b) => b.vfs)).toEqual([FIT_TYPE.value, FIT_TYPE.value, FIT_TYPE.value])
    expect(bands.map((b) => b.lfs)).toEqual([FIT_TYPE.label, FIT_TYPE.label, FIT_TYPE.label])
    // The sizes the design settled on: 21 for a reading, 11 for its term.
    expect(FIT_TYPE.value).toBe(21)
    expect(FIT_TYPE.label).toBe(11)
  })

  it('keeps the term exactly one deliberate step below the reading', () => {
    const [band] = readouts(MEASURED)
    expect(band.lfs).toBeLessThan(band.vfs)
    expect(band.lfs / band.vfs).toBeCloseTo(FIT_TYPE.label / FIT_TYPE.value, 6)
  })

  it('pulls the WHOLE set down for one long reading, never just that band', () => {
    // The set is what a customer compares; one member quietly rendering at
    // some other size is the bug this pins.
    const bands = readouts([
      marker('Chest', '52 cm', 30),
      marker('Waist', 'Approximately 48', 52),
    ])
    expect(new Set(bands.map((b) => b.vfs)).size).toBe(1)
    expect(new Set(bands.map((b) => b.lfs)).size).toBe(1)
    expect(bands[0].vfs).toBeLessThan(FIT_TYPE.value)
    expect(bands[0].lfs / bands[0].vfs).toBeCloseTo(FIT_TYPE.label / FIT_TYPE.value, 6)
  })

  it('lets a bare tape constrain nothing — a band with no fact claims no room', () => {
    // Two of three console bands carry readings; the empty one must not drag
    // the scale anywhere, in either direction.
    const some = readouts([marker('Chest', '52 cm', 30), marker('Hem', '50.5 cm', 74)])
    expect(some).toHaveLength(2)
    expect(some.map((b) => b.vfs)).toEqual([FIT_TYPE.value, FIT_TYPE.value])
  })

  it('agrees across tiers: the sheet draws the same two tiers, not smaller ones', () => {
    const sheet = readouts(MEASURED, 'sheet')
    expect(sheet).toHaveLength(2)
    expect(sheet.every((b) => b.vfs === FIT_TYPE.value && b.lfs === FIT_TYPE.label)).toBe(true)
  })

  it('never lets a reading run off the stage, at any size it settles on', () => {
    for (const fit of [
      MEASURED,
      [marker('Waist', 'Approximately 48', 52)],
      [marker('Chest', '52 cm', 30), marker('Sleeve length from shoulder', '22 cm', 70)],
    ]) {
      for (const band of readouts(fit)) {
        const value = band.fact?.value ?? ''
        const room = band.anchor === 'start' ? FIT_VIEW_W - band.vx : band.vx
        // 0.62 em per character is the advance the solver reserves with.
        expect(room + 0.01).toBeGreaterThanOrEqual(value.length * 0.62 * band.vfs)
      }
    }
  })

  it('bottoms out at the declared floor rather than inventing a smaller size', () => {
    expect(readoutScale([marker('Chest', 'x'.repeat(200), 30)])).toBe(FIT_TYPE.valueMin)
    expect(readoutScale([])).toBe(FIT_TYPE.value)
    expect(readoutScale([null])).toBe(FIT_TYPE.value)
  })

  it('flips the lines above a low tape without changing their sizes', () => {
    // A hem tape near the stage floor swaps value and term so neither lands on
    // the size whisper — a POSITION change, and pointedly not a size one.
    const [low] = readouts([marker('Hem', '50.5 cm', 100)])
    expect(low.valueY).toBeLessThan(low.labelY)
    expect(low.vfs).toBe(FIT_TYPE.value)
    expect(low.lfs).toBe(FIT_TYPE.label)
  })
})
