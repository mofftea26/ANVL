import { describe, expect, it } from 'vitest'
import type { PassportEffectFacts, PassportEffectMarker } from '../../effectFacts'
import {
  MAX_HOLO_TAGS,
  TAG_HEIGHT,
  imageBoxWorldSize,
  layoutHoloTags,
  tagsFromFacts,
  type HoloTagSpec,
  type HoloTagStage,
} from '../holoTags'

/**
 * The Blueprint hologram's plates: what they may say, and where they hang.
 * Pure and three.js-free, so both contracts are testable without a GPU — the
 * gate that decides whether any of it mounts is covered in
 * `../../sections/__tests__/EffectBlueprint.test.tsx`.
 */

/** Only `blueprint` matters here; the other lists belong to sibling effects. */
const factsWith = (blueprint: PassportEffectMarker[]): PassportEffectFacts => ({
  blueprint,
  specs: [],
  fit: [],
})

/**
 * The honesty rules, stated as tests. A passport's whole promise is that what
 * it shows is true of THIS piece, so the plates are allowed to be fewer — or
 * absent — but never invented.
 */
describe('tagsFromFacts', () => {
  const fact = (n: number): PassportEffectMarker => ({
    label: `L${n}`,
    value: `V${n}`,
    x: 50,
    y: 20 + n * 10,
  })

  it('takes the front of the list and truncates to the available slots', () => {
    const specs = tagsFromFacts(factsWith([1, 2, 3, 4, 5].map(fact)))
    expect(specs).toHaveLength(MAX_HOLO_TAGS)
    expect(specs.map((s) => s.label)).toEqual(['L1', 'L2', 'L3'])
  })

  it('carries the authored placement through, not just the strings', () => {
    expect(tagsFromFacts(factsWith([fact(1)]))).toEqual([
      { label: 'L1', value: 'V1', place: { x: 50, y: 30 } },
    ])
    expect(tagsFromFacts(factsWith([fact(1), fact(2)]))).toHaveLength(2)
  })

  it('yields nothing at all for empty or absent facts — no fallback constants', () => {
    expect(tagsFromFacts(factsWith([]))).toEqual([])
    expect(tagsFromFacts(undefined)).toEqual([])
  })

  it('honours a caller-supplied slot count, including none', () => {
    expect(tagsFromFacts(factsWith([1, 2, 3].map(fact)), 2)).toHaveLength(2)
    expect(tagsFromFacts(factsWith([1, 2, 3].map(fact)), 0)).toEqual([])
  })

  it('drops a fact with a blank half rather than projecting an empty plate', () => {
    const specs = tagsFromFacts(
      factsWith([
        { label: '  ', value: '260 GSM', x: 50, y: 40 },
        { label: 'Cotton', value: '   ', x: 50, y: 40 },
        { label: '  Cotton  ', value: '  92%  ', x: 50, y: 40 },
      ]),
    )
    expect(specs).toEqual([{ label: 'Cotton', value: '92%', place: { x: 50, y: 40 } }])
  })
})

describe('imageBoxWorldSize', () => {
  it('scales the LARGEST image dimension to the cloud fit, either orientation', () => {
    expect(imageBoxWorldSize(0.8, 3.2)).toEqual({ width: 3.2 * 0.8, height: 3.2 })
    expect(imageBoxWorldSize(2, 3.2)).toEqual({ width: 3.2, height: 1.6 })
  })
})

describe('layoutHoloTags', () => {
  /* A roomy stage: a garment 3 world units tall (deep enough that the frozen
     slots need no spreading apart), inside a viewport nothing has to be
     clamped to — so a moved plate is the placement talking, not a guard. */
  const stage: HoloTagStage = { minY: -1.5, height: 3, halfW: 0.7, vpW: 6, vpH: 6 }
  /* A stand-in for the real box→bounds transform: y runs DOWN in marker
     percent and UP in world, which is the flip most likely to be got wrong. */
  const toWorld = (place: { x: number; y: number }) => ({
    x: (place.x / 100 - 0.5) * 2,
    y: (0.5 - place.y / 100) * 2,
  })
  const spec = (label: string, place: HoloTagSpec['place']): HoloTagSpec => ({
    label,
    value: `${label} value`,
    place,
  })

  it('hangs a placed plate at the height it was authored at', () => {
    // 20% down the render ⇒ the upper third of the world box.
    const [tag] = layoutHoloTags([spec('A', { x: 80, y: 20 })], stage, toWorld)
    expect(tag.y).toBeCloseTo(0.6, 5)
  })

  it('puts the plate on the rail nearest the marker and points the leader back', () => {
    const [left] = layoutHoloTags([spec('A', { x: 15, y: 50 })], stage, toWorld)
    const [right] = layoutHoloTags([spec('A', { x: 85, y: 50 })], stage, toWorld)
    expect(left.x).toBeLessThan(0)
    expect(right.x).toBeGreaterThan(0)
    // The leader ends ON the marker's own x (|0.15 - 0.5| * 2 = 0.7), signed
    // toward the same side, so it always reads as pointing INTO the piece.
    expect(left.anchorX).toBeCloseTo(-0.7, 5)
    expect(right.anchorX).toBeCloseTo(0.7, 5)
  })

  it('keeps two markers placed on top of each other readable', () => {
    const tags = layoutHoloTags(
      [spec('A', { x: 80, y: 50 }), spec('B', { x: 82, y: 51 })],
      stage,
      toWorld,
    )
    expect(Math.abs(tags[0].y - tags[1].y)).toBeGreaterThanOrEqual(TAG_HEIGHT)
  })

  it('falls back to the frozen composition for an UNPLACED plate', () => {
    const [tag] = layoutHoloTags([spec('A', null)], stage, toWorld)
    // Slot 0: right side, 0.74 of the garment height above its hem.
    expect(tag.x).toBeGreaterThan(0)
    expect(tag.y).toBeCloseTo(stage.minY + stage.height * 0.74, 5)
  })

  it('falls back to the frozen composition when the render never decoded', () => {
    const placed = layoutHoloTags([spec('A', { x: 10, y: 10 })], stage, null)
    const unplaced = layoutHoloTags([spec('A', null)], stage, null)
    // No image box ⇒ percent has no world to map into, so both take the slot.
    expect(placed[0].y).toBeCloseTo(unplaced[0].y, 5)
    expect(placed[0].x).toBeCloseTo(unplaced[0].x, 5)
  })

  it('never lets a plate leave the visible world box, however it was placed', () => {
    const cramped: HoloTagStage = { ...stage, vpH: 1.4 }
    const limit = cramped.vpH / 2 - TAG_HEIGHT / 2
    for (const tag of layoutHoloTags(
      [spec('A', { x: 80, y: 0 }), spec('B', { x: 20, y: 100 })],
      cramped,
      toWorld,
    )) {
      expect(Math.abs(tag.y)).toBeLessThanOrEqual(limit)
    }
  })

  it('draws no more plates than the composition can carry', () => {
    const many = ['A', 'B', 'C', 'D'].map((l, i) => spec(l, { x: 60, y: 10 + i * 25 }))
    expect(layoutHoloTags(many, stage, toWorld)).toHaveLength(MAX_HOLO_TAGS)
  })
})
