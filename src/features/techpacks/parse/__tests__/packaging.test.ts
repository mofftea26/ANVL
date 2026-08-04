import { describe, expect, it } from 'vitest'

import { parsePackaging } from '../pages/packaging'
import type { TechpackIssue, TechpackPackaging } from '../../schema/techpack.zod'
import { makeContext } from './fixtures/makeContext'
import { packagingPage, type PackagingPageOptions } from './fixtures/packagingPage'

function run(options: PackagingPageOptions = {}): {
  packaging: TechpackPackaging
  issues: TechpackIssue[]
} {
  const { ctx, issues } = makeContext()
  const result = parsePackaging(packagingPage(options), ctx)
  expect(result.packaging).toBeDefined()
  return { packaging: result.packaging!, issues }
}

describe('parsePackaging', () => {
  it('reads the care label as a column, not as page rows', () => {
    // Every line here used to fail differently: the composition picked up a
    // `0.65”` from the size-label column 315 pt to its right, the two wrapped
    // instructions lost their second half, and `COOL WASH INSIDE OUT` /
    // `COOL IRON ON REVERSE` vanished altogether because a `FOLD` marker and a
    // `SIZE:` caption happened to share their row.
    const { packaging } = run()
    expect(packaging.careLabel.lines).toEqual([
      '100% COTTON',
      'COOL WASH INSIDE OUT',
      'USE MILD DETERGENT',
      'WASH DARK COLORS SEPARATELY',
      'RESHAPE WHILST DAMP',
      'DO NOT TUMBLE DRY',
      'COOL IRON ON REVERSE',
      'DO NOT IRON DECORATION',
      'DO NOT DRY CLEAN',
    ])
    expect(packaging.careLabel.textAvailable).toBe(true)
  })

  it('reads the wrapped "Designed in / Lebanon" origin', () => {
    const { packaging } = run()
    expect(packaging.careLabel.origin).toBe('Lebanon')
  })

  it('reads the origin when the label prints it on one line', () => {
    const { packaging } = run({
      origin: [{ text: 'Designed in Lebanon', x: 60.4, y: 254.9, w: 95.7, h: 9 }],
    })
    expect(packaging.careLabel.origin).toBe('Lebanon')
  })

  it('keeps each composition line separate when no dash divides them', () => {
    // The blend pack prints `95% COTTON` and `5% SPANDEX` on consecutive rows
    // with no separator, so the dash-folding rule alone would weld them.
    const { packaging } = run({
      careLabel: [
        { text: '95% COTTON', x: 76.1, y: 317.6, w: 24.6, h: 3.5 },
        { text: '5% SPANDEX', x: 76.4, y: 322.1, w: 23.9, h: 3.5 },
        { text: '-', x: 87.5, y: 326.6, w: 1.6, h: 3.5 },
        { text: 'DO NOT TUMBLE DRY', x: 67.8, y: 331.1, w: 41.0, h: 3.5 },
        { text: '-', x: 87.5, y: 335.6, w: 1.6, h: 3.5 },
        { text: 'DO NOT DRY CLEAN', x: 69.4, y: 340.1, w: 37.9, h: 3.5 },
      ],
    })
    expect(packaging.careLabel.lines).toEqual([
      '95% COTTON',
      '5% SPANDEX',
      'DO NOT TUMBLE DRY',
      'DO NOT DRY CLEAN',
    ])
  })

  it('tells the care and size labels apart by column, not reading order', () => {
    // Both dimensions are printed in the same heading band; only the care one
    // shares x with the label block below it.
    const { packaging } = run()
    expect(packaging.careLabel.visibleSize).toBe('1.875”X1.25”')
    expect(packaging.sizeLabel.visibleSize).toBe('0.65”X0.50”')
  })

  it('raises care_label_image_only when the label is artwork', () => {
    // The seamless pack heat-transfers its label: the page still carries its
    // headings, dimensions and sew markers, but not one line of care copy.
    const { packaging, issues } = run({ careLabel: [], origin: [] })
    expect(packaging.careLabel.textAvailable).toBe(false)
    expect(packaging.careLabel.lines).toEqual([])
    expect(issues.map((issue) => issue.code)).toContain('care_label_image_only')
  })

  it('still collects the printed size run', () => {
    const { packaging } = run()
    expect(packaging.sizeLabel.sizes).toEqual(['S', 'M', 'L', 'XL'])
  })
})
