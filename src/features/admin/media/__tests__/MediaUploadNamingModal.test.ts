import { describe, expect, it } from 'vitest'

import { CUSTOM_SLOT, buildUploadName } from '../MediaUploadNamingModal'

const file = (name: string) => new File(['x'], name, { type: 'image/png' })

describe('buildUploadName', () => {
  it('names registry-context uploads [context]-[slot].ext', () => {
    const name = buildUploadName(file('IMG_0001.PNG'), {
      context: 'general',
      slot: 'emblemFallback',
      purpose: '',
    })
    expect(name).toBe('general-emblemfallback.png')
  })

  it('supports a custom slot name in registry contexts', () => {
    const name = buildUploadName(file('photo.jpg'), {
      context: 'general',
      slot: CUSTOM_SLOT,
      purpose: 'Hero Alt Cut!',
    })
    expect(name).toBe('general-hero-alt-cut.jpg')
  })

  it('requires the custom name when the custom slot is picked', () => {
    expect(
      buildUploadName(file('photo.jpg'), {
        context: 'general',
        slot: CUSTOM_SLOT,
        purpose: '   ',
      }),
    ).toBeNull()
  })

  it('still forces kebab purpose for free-purpose contexts', () => {
    expect(
      buildUploadName(file('macro.webp'), {
        context: 'product',
        slot: '',
        purpose: 'Seamless Tee Macro',
      }),
    ).toBe('product-seamless-tee-macro.webp')
  })

  it('returns null for unknown contexts or missing parts', () => {
    expect(
      buildUploadName(file('a.png'), { context: 'nope', slot: 'x', purpose: '' }),
    ).toBeNull()
    expect(
      buildUploadName(file('a.png'), { context: 'general', slot: '', purpose: '' }),
    ).toBeNull()
  })
})
