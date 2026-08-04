import { describe, expect, it } from 'vitest'

import { parseSizingGuide } from '../pages/sizingGuide'
import type { TechpackIssue, TechpackSizing } from '../../schema/techpack.zod'
import { OVERSIZED_TEE_ROWS, sizingGuidePage } from './fixtures/sizingPage'
import { makeContext } from './fixtures/makeContext'

function run(extract = sizingGuidePage()): {
  sizing: TechpackSizing
  issues: TechpackIssue[]
} {
  const { ctx, issues } = makeContext()
  const result = parseSizingGuide(extract, ctx)
  expect(result.sizing).toBeDefined()
  return { sizing: result.sizing!, issues }
}

const valuesFor = (sizing: TechpackSizing, rowKey: string): Array<number | null> =>
  sizing.rows.find((r) => r.rowKey === rowKey)?.values ?? []

describe('parseSizingGuide', () => {
  it('reads every row of the real oversized-tee table', () => {
    const { sizing } = run()
    expect(sizing.rows).toHaveLength(OVERSIZED_TEE_ROWS.length)
    expect(sizing.sizes).toEqual(['SMALL', 'MEDIUM', 'LARGE', 'X-LARGE'])
    expect(sizing.unit).toBe('in')
  })

  it('keeps each row aligned with its own label despite wrapped labels', () => {
    // This is the whole point of the coordinate-driven parse. Read as text
    // lines, these rows shift by one and every value lands under the wrong
    // measurement — plausibly, and therefore invisibly.
    const { sizing } = run()
    expect(valuesFor(sizing, 'length')).toEqual([26, 27, 28, 29])
    expect(valuesFor(sizing, 'chest')).toEqual([22.75, 24, 25.25, 26.5])
    expect(valuesFor(sizing, 'waist')).toEqual([22, 23.25, 24.5, 25.75])
    expect(valuesFor(sizing, 'collar')).toEqual([8.25, 8.5, 8.75, 9])
    expect(valuesFor(sizing, 'sleeve')).toEqual([14.5, 15.25, 16, 16.75])
    expect(valuesFor(sizing, 'cuff')).toEqual([7, 7.25, 7.5, 7.75])
  })

  it('handles the row whose values sit on the second label line', () => {
    // BOTTOM 1/2 WIDTH prints its numbers beside "WIDTH - D", not beside
    // "BOTTOM 1/2" — the specific layout that breaks line-based reading.
    const { sizing } = run()
    expect(valuesFor(sizing, 'bottom')).toEqual([21.25, 22.5, 23.75, 25])
  })

  it('maps every printed row onto a site size-chart row', () => {
    const { sizing } = run()
    expect(sizing.rows.map((r) => r.rowKey)).toEqual([
      'length',
      'chest',
      'waist',
      'bottom',
      'collar',
      'sleeve',
      'cuff',
    ])
  })

  it('records the marker letter and half-measurement flag per row', () => {
    const { sizing } = run()
    const chest = sizing.rows.find((r) => r.rowKey === 'chest')
    expect(chest?.letter).toBe('B')
    expect(chest?.isHalf).toBe(true)

    const length = sizing.rows.find((r) => r.rowKey === 'length')
    expect(length?.letter).toBe('A')
    expect(length?.isHalf).toBe(false)
  })

  it('places the A-G diagram markers as percentages of the diagram', () => {
    const { sizing } = run()
    expect(sizing.diagramImageId).toBe('p4-i0')
    expect(sizing.markers.map((m) => m.letter).sort()).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
    ])
    for (const marker of sizing.markers) {
      for (const position of marker.positions) {
        expect(position.x).toBeGreaterThanOrEqual(0)
        expect(position.x).toBeLessThanOrEqual(100)
        expect(position.y).toBeGreaterThanOrEqual(0)
        expect(position.y).toBeLessThanOrEqual(100)
      }
    }
  })

  it('never lets a disclaimer become a row label', () => {
    const { sizing } = run()
    const allText = JSON.stringify(sizing).toLowerCase()
    expect(allText).not.toContain('fittdesign')
    expect(allText).not.toContain('not liable')
    expect(allText).not.toContain('disclaimer')
  })

  it('produces a clean parse with no warnings for a well-formed page', () => {
    const { issues } = run()
    expect(issues.filter((i) => i.severity !== 'info')).toEqual([])
  })
})

describe('parseSizingGuide — the drift canary', () => {
  it('flags a row whose values do not increase across sizes', () => {
    // A graded run always increases. A row that does not has almost certainly
    // picked up a neighbouring row's numbers.
    const rows = structuredClone(OVERSIZED_TEE_ROWS)
    rows[1] = { ...rows[1]!, values: ['24.00', '22.75', '25.25', '26.50'] }

    const { issues } = run(sizingGuidePage({ rows }))
    const drift = issues.find((i) => i.code === 'sizing_row_not_monotonic')
    expect(drift).toBeDefined()
    expect(drift?.path).toContain('chest')
  })

  it('flags an implausible measurement', () => {
    const rows = structuredClone(OVERSIZED_TEE_ROWS)
    rows[0] = { ...rows[0]!, values: ['26.00', '27.00', '28.00', '99.00'] }

    const { issues } = run(sizingGuidePage({ rows }))
    expect(issues.some((i) => i.code === 'sizing_value_implausible')).toBe(true)
  })

  it('reports an unmapped measurement rather than guessing a row', () => {
    const rows = structuredClone(OVERSIZED_TEE_ROWS)
    rows.push({
      labelLines: ['POCKET DEPTH', '- H'],
      values: ['5.00', '5.25', '5.50', '5.75'],
    })

    const { sizing, issues } = run(sizingGuidePage({ rows }))
    expect(issues.some((i) => i.code === 'sizing_row_unmapped')).toBe(true)
    expect(sizing.rows.find((r) => r.label.startsWith('POCKET'))?.rowKey).toBeNull()
  })

  it('raises an error when the table has no size headings at all', () => {
    const { ctx, issues } = makeContext()
    const result = parseSizingGuide(sizingGuidePage({ rows: [] }), ctx)
    // Headings still exist in the fixture, so an empty body means "no rows".
    expect(result.sizing?.rows ?? []).toEqual([])
    expect(issues.some((i) => i.code === 'sizing_no_rows')).toBe(true)
  })
})
