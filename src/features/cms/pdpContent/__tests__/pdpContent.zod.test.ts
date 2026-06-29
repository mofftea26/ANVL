import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PDP_PRODUCT_CONTENT,
  getPdpProductContent,
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
})
