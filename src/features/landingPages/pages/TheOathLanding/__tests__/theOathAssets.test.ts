import { describe, expect, it, beforeEach } from 'vitest'
import {
  bindOathCmsAssets,
  bindOathCmsThemedMarkups,
  OATH_LOGO_PLACEHOLDER,
  oathCrestEmblem,
  oathDropLogo,
  oathLoadingEmblem,
  oathThemedMarkup,
} from '../theOathAssets'

describe('theOathAssets loading emblem', () => {
  beforeEach(() => {
    bindOathCmsAssets({})
    bindOathCmsThemedMarkups({})
  })

  it('prefers CMS loadingEmblem over dropLogo', () => {
    bindOathCmsAssets({
      loadingEmblem: 'https://cdn.test/loading.svg',
      dropLogo: 'https://cdn.test/drop.svg',
    })
    expect(oathLoadingEmblem()).toBe('https://cdn.test/loading.svg')
  })

  it('falls back through dropLogo and emblemFallback', () => {
    bindOathCmsAssets({
      dropLogo: 'https://cdn.test/drop.svg',
      emblemFallback: 'https://cdn.test/emblem.svg',
    })
    expect(oathLoadingEmblem()).toBe('https://cdn.test/drop.svg')

    bindOathCmsAssets({ emblemFallback: 'https://cdn.test/emblem.svg' })
    expect(oathLoadingEmblem()).toBe('https://cdn.test/emblem.svg')
  })
})

describe('theOathAssets drop logo and crest emblem', () => {
  beforeEach(() => {
    bindOathCmsAssets({})
    bindOathCmsThemedMarkups({})
  })

  it('oathDropLogo prefers CMS dropLogo over placeholder', () => {
    bindOathCmsAssets({ dropLogo: 'https://cdn.test/drop.svg' })
    expect(oathDropLogo()).toBe('https://cdn.test/drop.svg')
  })

  it('oathDropLogo falls back to OATH_LOGO_PLACEHOLDER when CMS is empty', () => {
    expect(oathDropLogo()).toBe(OATH_LOGO_PLACEHOLDER)
  })

  it('oathCrestEmblem prefers CMS crestSvg', () => {
    bindOathCmsAssets({
      crestSvg: 'https://cdn.test/crest.svg',
      dropLogo: 'https://cdn.test/drop.svg',
    })
    expect(oathCrestEmblem()).toBe('https://cdn.test/crest.svg')
  })

  it('oathCrestEmblem falls back to oathDropLogo when crestSvg is missing', () => {
    bindOathCmsAssets({ dropLogo: 'https://cdn.test/drop.svg' })
    expect(oathCrestEmblem()).toBe('https://cdn.test/drop.svg')

    bindOathCmsAssets({})
    expect(oathCrestEmblem()).toBe(OATH_LOGO_PLACEHOLDER)
  })
})

describe('theOathAssets themed markups', () => {
  beforeEach(() => {
    bindOathCmsAssets({})
    bindOathCmsThemedMarkups({})
  })

  it('oathThemedMarkup returns bound SSR markup', () => {
    bindOathCmsThemedMarkups({
      dropLogo: '<svg>drop</svg>',
      crestSvg: '<svg>crest</svg>',
    })
    expect(oathThemedMarkup('dropLogo')).toBe('<svg>drop</svg>')
    expect(oathThemedMarkup('crestSvg')).toBe('<svg>crest</svg>')
  })

  it('oathThemedMarkup returns null when unbound', () => {
    expect(oathThemedMarkup('dropLogo')).toBeNull()
    expect(oathThemedMarkup('crestSvg')).toBeNull()
  })
})
