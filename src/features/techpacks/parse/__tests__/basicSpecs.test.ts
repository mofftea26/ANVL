import { describe, expect, it } from 'vitest'

import { parseBasicSpecs } from '../pages/basicSpecs'
import type { TechpackBlueprint, TechpackIssue } from '../../schema/techpack.zod'
import {
  OVERSIZED_TEE_CARDS,
  OVERSIZED_TEE_MARKERS,
  basicSpecsPage,
  type BasicSpecsOptions,
} from './fixtures/basicSpecsPage'
import { makeContext } from './fixtures/makeContext'

function run(options: BasicSpecsOptions = {}): {
  blueprint: TechpackBlueprint
  issues: TechpackIssue[]
} {
  const { ctx, issues } = makeContext()
  const result = parseBasicSpecs(basicSpecsPage(options), ctx)
  expect(result.blueprint).toBeDefined()
  return { blueprint: result.blueprint!, issues }
}

const codes = (blueprint: TechpackBlueprint): string[] =>
  blueprint.features.map((f) => f.code).sort()

describe('parseBasicSpecs', () => {
  it('finds one feature per lettered card', () => {
    const { blueprint } = run()
    expect(codes(blueprint)).toEqual(OVERSIZED_TEE_CARDS.map((c) => c.code).sort())
  })

  it('separates perimeter card keys from markers on the garment', () => {
    // Both populations are single lowercase letters and look identical in the
    // text layer. Getting this wrong invents a dozen features named after
    // stray markers — the markers themselves are only ever excluded.
    const { blueprint } = run()
    expect(blueprint.features).toHaveLength(12)
    expect(codes(blueprint)).not.toContain('z')
  })

  it('reads the label off each card', () => {
    const { blueprint } = run()
    const byCode = new Map(blueprint.features.map((f) => [f.code, f]))
    expect(`${byCode.get('a')?.label} ${byCode.get('a')?.detail}`.toLowerCase()).toContain(
      'high neck',
    )
    expect(`${byCode.get('d')?.label} ${byCode.get('d')?.detail}`.toLowerCase()).toContain(
      'sleeve type',
    )
  })

  it('splits a supplier cross-reference off the label', () => {
    // "(SEE TRIM A)" points at another page of the pack — useful to an
    // operator, meaningless to a customer, so it is held back separately.
    const { blueprint } = run()
    const j = blueprint.features.find((f) => f.code === 'j')
    expect(j?.supplierRef).toBe('SEE TRIM A')
    expect(`${j?.label} ${j?.detail}`).not.toContain('SEE TRIM A')
  })

  it('places nothing — the drawing is no longer extracted', () => {
    // The garment drawing was a page crop with the supplier's own annotation
    // pins on it; the passport renders these callouts as cards instead. With
    // no frame to be a percentage of, a position would be a number with no
    // meaning, so the parser emits none.
    const { blueprint } = run()
    expect(blueprint.features.every((f) => f.positions.length === 0)).toBe(true)
  })

  it('parses a clean page without warnings', () => {
    const { issues } = run()
    expect(issues.filter((i) => i.severity !== 'info')).toEqual([])
  })
})

describe('parseBasicSpecs — degraded pages', () => {
  it('reports a marker that has no labelled card', () => {
    const { issues } = run({
      markers: [...OVERSIZED_TEE_MARKERS, { code: 'z', x: 500, y: 400 }],
    })
    const orphan = issues.find((i) => i.code === 'blueprint_marker_without_label')
    expect(orphan).toBeDefined()
    expect(orphan?.message).toContain('"z"')
  })

  it('keeps a card whose marker was never printed on the garment', () => {
    const { blueprint } = run({
      markers: OVERSIZED_TEE_MARKERS.filter((m) => m.code !== 'e'),
    })
    expect(blueprint.features.find((f) => f.code === 'e')).toBeDefined()
  })

  it('keeps the construction detail on a page with no usable image', () => {
    // Strip the page's images and the geometric fallback — the only classifier
    // left once type size is uniform — has nothing to centre itself on. The
    // cards are what ships, so they must survive that.
    const { blueprint } = run({ withFlat: false })
    expect(blueprint.features.length).toBeGreaterThan(0)
  })

  it('reads a page whose letters are all perimeter keys', () => {
    // Nothing sits on the garment, so every letter is a card key. That is a
    // complete feature list, not a degraded one.
    const { blueprint, issues } = run({ markers: [] })
    expect(blueprint.features.length).toBeGreaterThan(0)
    expect(issues.some((i) => i.code === 'blueprint_marker_without_label')).toBe(false)
  })

  it('reports a page with no lettered markers at all', () => {
    const { ctx, issues } = makeContext()
    const result = parseBasicSpecs(basicSpecsPage({ cards: [], markers: [] }), ctx)
    expect(result.blueprint).toBeUndefined()
    expect(issues.some((i) => i.code === 'blueprint_no_markers')).toBe(true)
  })
})
