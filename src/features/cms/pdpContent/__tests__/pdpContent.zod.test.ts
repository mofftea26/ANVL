import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PDP_PRODUCT_CONTENT,
  getPdpProductContent,
  hasAuthoredPdpContent,
  parsePdpContent,
} from '@/features/cms/pdpContent/pdpContent.zod'

describe('parsePdpContent', () => {
  it('returns an empty map for nullish / non-object input', () => {
    expect(parsePdpContent(undefined)).toEqual({})
    expect(parsePdpContent(null)).toEqual({})
    expect(parsePdpContent('x')).toEqual({})
    expect(parsePdpContent([])).toEqual({})
  })

  it('fills per-product defaults for a partial entry', () => {
    const cfg = parsePdpContent({ tee: { storyBody: 'Forged.' } })
    expect(cfg.tee.storyBody).toBe('Forged.')
    expect(cfg.tee.care).toEqual([])
    expect(cfg.tee.materials).toEqual([])
    expect(cfg.tee.careItems).toEqual([])
    expect(cfg.tee.details).toEqual([])
    expect(cfg.tee.materialMacro).toBe('')
  })

  it('drops blank slug keys and coerces bad value types', () => {
    const cfg = parsePdpContent({ '': { storyBody: 'x' }, tee: 'nope' })
    expect(cfg['']).toBeUndefined()
    expect(cfg.tee).toEqual(DEFAULT_PDP_PRODUCT_CONTENT)
  })

  it('getPdpProductContent returns defaults for unknown slug', () => {
    expect(getPdpProductContent({}, 'missing')).toEqual(DEFAULT_PDP_PRODUCT_CONTENT)
  })

  it('MIGRATION: a legacy blob (no structured fields) parses and keeps its data', () => {
    // A blob authored before the structured-list rework — only the flat fields.
    const legacy = {
      tee: {
        storyHeading: 'The piece',
        storyBody: 'Old story.',
        materialTitle: 'Cotton',
        materialNote: '240 GSM',
        care: ['Wash cold', 'Hang dry'],
        designDetails: ['Flatlock seams', 'Ribbed collar'],
        materialMacro: 'asset-1',
      },
    }
    const cfg = parsePdpContent(legacy)
    // Legacy strings survive untouched (never lost).
    expect(cfg.tee.care).toEqual(['Wash cold', 'Hang dry'])
    expect(cfg.tee.designDetails).toEqual(['Flatlock seams', 'Ribbed collar'])
    expect(cfg.tee.materialTitle).toBe('Cotton')
    expect(cfg.tee.materialNote).toBe('240 GSM')
    // New structured fields default to empty (additive migration).
    expect(cfg.tee.materials).toEqual([])
    expect(cfg.tee.careItems).toEqual([])
    expect(cfg.tee.details).toEqual([])
  })

  it('ROUND-TRIP: the new structured shape parses and preserves entries', () => {
    const authored = {
      tee: {
        materials: [{ id: 'm1', name: 'Cotton', percentage: 80, gsm: 240, image: 'a1' }],
        careItems: [{ id: 'c1', icon: 'snowflake', name: 'Machine wash cold', value: '', note: '' }],
        details: [{ id: 'd1', title: 'Flatlock seams', description: 'Chafe-free', image: '' }],
      },
    }
    const cfg = parsePdpContent(authored)
    expect(cfg.tee.materials).toEqual(authored.tee.materials)
    expect(cfg.tee.careItems[0].name).toBe('Machine wash cold')
    expect(cfg.tee.details[0].title).toBe('Flatlock seams')
  })

  it('clamps out-of-range material percentage / gsm to defaults', () => {
    const cfg = parsePdpContent({
      tee: {
        materials: [
          { id: 'm', name: 'X', percentage: 250, gsm: -4, image: '' },
          { id: 'n', name: 'Y', percentage: 50, gsm: 200, image: '' },
        ],
      },
    })
    // Bad numbers fall to null via `.catch`; valid ones pass through.
    expect(cfg.tee.materials[0].percentage).toBeNull()
    expect(cfg.tee.materials[0].gsm).toBeNull()
    expect(cfg.tee.materials[1].percentage).toBe(50)
    expect(cfg.tee.materials[1].gsm).toBe(200)
  })
})

describe('hasAuthoredPdpContent', () => {
  it('is false for undefined / all-empty entries', () => {
    expect(hasAuthoredPdpContent(undefined)).toBe(false)
    expect(hasAuthoredPdpContent(DEFAULT_PDP_PRODUCT_CONTENT)).toBe(false)
  })

  it('detects legacy and structured authorship', () => {
    expect(
      hasAuthoredPdpContent({ ...DEFAULT_PDP_PRODUCT_CONTENT, care: ['Wash cold'] }),
    ).toBe(true)
    expect(
      hasAuthoredPdpContent({
        ...DEFAULT_PDP_PRODUCT_CONTENT,
        materials: [{ id: 'm', name: 'Cotton', percentage: null, gsm: null, image: '' }],
      }),
    ).toBe(true)
    // A structured entry with only a blank name doesn't count as authored.
    expect(
      hasAuthoredPdpContent({
        ...DEFAULT_PDP_PRODUCT_CONTENT,
        materials: [{ id: 'm', name: '   ', percentage: null, gsm: null, image: '' }],
      }),
    ).toBe(false)
  })
})
