import { describe, expect, it } from 'vitest'

import { parseColorwaySchedule } from '../pages/colorwaySchedule'
import {
  COMPRESSION_COLORWAY_BLOCKS,
  OVERSIZED_COLORWAY_BLOCKS,
  colorwaySchedulePage,
} from './fixtures/colorwayPage'
import { makeContext } from './fixtures/makeContext'

describe('parseColorwaySchedule', () => {
  it('reads role, colour name and values as separate fields', () => {
    const { ctx, issues } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({ blocks: OVERSIZED_COLORWAY_BLOCKS, index: 1 }),
      ctx,
    )

    const colorway = result.colorways?.[0]
    expect(colorway?.index).toBe(1)
    expect(colorway?.roles.map((r) => [r.role, r.colorName, r.pantone, r.hex])).toEqual([
      ['PRINT', 'LAVA SMOKE', '18-0202 TCX', '#5e6064'],
      ['TRIM', '', '', ''],
      ['GRAPHIC', '', '', ''],
      ['MAIN', 'PROCESS BLACK C', '', '#302e2c'],
    ])
    expect(issues).toEqual([])
  })

  it('names the colorway after its MAIN colour', () => {
    const { ctx } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({ blocks: OVERSIZED_COLORWAY_BLOCKS }),
      ctx,
    )
    expect(result.colorways?.[0]?.name).toBe('PROCESS BLACK C')
  })

  it('keeps the repeated CLIENT footer out of the colour columns', () => {
    // The footer shares its left edge with no block here, but it sits inside
    // `bodyText`'s default window and used to surface as a colour name.
    const { ctx } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({
        blocks: [
          { ...OVERSIZED_COLORWAY_BLOCKS[0]!, left: 19.1 },
          ...OVERSIZED_COLORWAY_BLOCKS.slice(1),
        ],
      }),
      ctx,
    )
    const texts = result.colorways?.[0]?.roles.map((r) => r.colorName) ?? []
    expect(texts).toEqual(['LAVA SMOKE', '', '', 'PROCESS BLACK C'])
    expect(texts.join(' ')).not.toMatch(/CLIENT|ANVL/)
  })

  it('drops a SEE cross-reference rather than storing it as a colour', () => {
    const { ctx } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({ blocks: OVERSIZED_COLORWAY_BLOCKS }),
      ctx,
    )
    const trim = result.colorways?.[0]?.roles.find((r) => r.roleKey === 'trim')
    expect(trim?.colorName).toBe('')
  })

  it('keeps two vertically stacked blocks in the same column apart', () => {
    const { ctx, issues } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({ blocks: COMPRESSION_COLORWAY_BLOCKS, index: 1, count: 1 }),
      ctx,
    )

    const roles = result.colorways?.[0]?.roles ?? []
    expect(roles.map((r) => r.role)).toEqual(['GRAPHIC', 'MAIN 1', 'SEAM', 'PRINT', 'MAIN 2'])
    expect(roles.map((r) => r.roleKey)).toEqual(['graphic', 'main-1', 'seam', 'print', 'main-2'])
    expect(roles.find((r) => r.roleKey === 'print')?.colorName).toBe('JOJOBA')
    expect(issues).toEqual([])
  })

  it('takes the colorway name from MAIN 1 when the pack numbers its mains', () => {
    const { ctx } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({ blocks: COMPRESSION_COLORWAY_BLOCKS, count: 1 }),
      ctx,
    )
    expect(result.colorways?.[0]?.name).toBe('PROCESS BLACK C')
  })

  it('does not mistake a letter-spaced "TCX NOT AVAILABLE" for a colour name', () => {
    // Verbatim from the packs: pdf.js welds the kerning pair in AVAILABLE, so
    // the run arrives as `AVA I L A B L E` and survives collapseLetterSpacing.
    // Spelling the fragments out here reproduces the joined text exactly.
    const { ctx } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({
        blocks: [
          {
            role: 'MAIN',
            left: 51.1,
            top: 141.6,
            code: 'TCX NOT AVA I L A B L E',
            name: 'PROCESS BLACK C',
            srgb: 'sRGB (48/46/44)',
          },
        ],
      }),
      ctx,
    )
    expect(result.colorways?.[0]?.roles[0]?.colorName).toBe('PROCESS BLACK C')
    expect(result.colorways?.[0]?.name).toBe('PROCESS BLACK C')
  })

  it('keeps a loosely leaded block whole', () => {
    // Block depth is measured from the page's own line pitch. Pegging it to
    // the font size instead would bake in the supplied packs' tight 1.17x
    // leading and drop the last line of any pack set more openly.
    const { ctx } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({
        blocks: [
          {
            role: 'MAIN',
            left: 51.1,
            top: 141.6,
            pitch: 14,
            code: '18-0202 TCX',
            name: 'LAVA SMOKE',
            srgb: 'sRGB (94/96/100)',
          },
        ],
      }),
      ctx,
    )
    expect(result.colorways?.[0]?.roles[0]).toMatchObject({
      role: 'MAIN',
      colorName: 'LAVA SMOKE',
      hex: '#5e6064',
    })
  })

  it('reads a role vocabulary it has never seen', () => {
    const { ctx } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({
        blocks: [
          {
            role: 'BINDING TAPE',
            left: 51.1,
            top: 141.6,
            code: '19-4052 TCX',
            name: 'CLASSIC BLUE',
            srgb: 'sRGB (15/76/129)',
          },
        ],
      }),
      ctx,
    )
    expect(result.colorways?.[0]?.roles[0]).toMatchObject({
      role: 'BINDING TAPE',
      roleKey: 'binding-tape',
      colorName: 'CLASSIC BLUE',
      pantone: '19-4052 TCX',
      hex: '#0f4c81',
    })
  })

  it('reports a block printed without a role label instead of guessing one', () => {
    const { ctx, issues } = makeContext()
    const result = parseColorwaySchedule(
      colorwaySchedulePage({
        blocks: [
          { ...OVERSIZED_COLORWAY_BLOCKS[0]!, role: '' },
          OVERSIZED_COLORWAY_BLOCKS[3]!,
        ],
      }),
      ctx,
    )

    expect(result.colorways?.[0]?.roles[0]).toMatchObject({ role: '', colorName: 'LAVA SMOKE' })
    expect(issues.map((i) => i.code)).toEqual(['colorway_role_unlabelled'])
  })

  it('raises an issue when the page carries no colour blocks at all', () => {
    const { ctx, issues } = makeContext()
    const result = parseColorwaySchedule(colorwaySchedulePage({ blocks: [] }), ctx)

    expect(result.colorways).toBeUndefined()
    expect(issues.map((i) => i.code)).toEqual(['colorway_no_roles'])
  })

  it('raises an issue when body text carries no code label to anchor on', () => {
    const { ctx, issues } = makeContext()
    const page = colorwaySchedulePage({ blocks: [] })
    const stray = colorwaySchedulePage({
      blocks: [
        {
          role: 'MAIN',
          left: 51.1,
          top: 141.6,
          codeLabel: 'REFER TO SWATCH CARD',
          code: 'TCX NOT AVAILABLE',
          name: 'LAVA SMOKE',
          srgb: 'sRGB (94/96/100)',
        },
      ],
    })
    const result = parseColorwaySchedule({ ...page, items: stray.items }, ctx)

    expect(result.colorways).toBeUndefined()
    expect(issues.map((i) => i.code)).toEqual(['colorway_no_roles'])
  })
})
