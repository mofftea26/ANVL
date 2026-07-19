import { describe, expect, it } from 'vitest'

import { buildUploadName } from '../MediaUploadNamingModal'

const file = (name: string) => new File(['x'], name, { type: 'image/png' })

describe('buildUploadName', () => {
  describe('prefixed mode', () => {
    it('names registry-context uploads [context]-[slot].ext', () => {
      const name = buildUploadName(file('IMG_0001.PNG'), {
        mode: 'prefixed',
        context: 'general',
        slot: 'emblemFallback',
        purpose: '',
        customName: '',
      })
      expect(name).toBe('general-emblemfallback.png')
    })

    it('still forces kebab purpose for free-purpose contexts', () => {
      expect(
        buildUploadName(file('macro.webp'), {
          mode: 'prefixed',
          context: 'product',
          slot: '',
          purpose: 'Seamless Tee Macro',
          customName: '',
        }),
      ).toBe('product-seamless-tee-macro.webp')
    })

    it('returns null for unknown contexts or missing parts', () => {
      expect(
        buildUploadName(file('a.png'), {
          mode: 'prefixed',
          context: 'nope',
          slot: 'x',
          purpose: '',
          customName: '',
        }),
      ).toBeNull()
      expect(
        buildUploadName(file('a.png'), {
          mode: 'prefixed',
          context: 'general',
          slot: '',
          purpose: '',
          customName: '',
        }),
      ).toBeNull()
    })

    it('ignores the custom name field while in prefixed mode', () => {
      expect(
        buildUploadName(file('a.png'), {
          mode: 'prefixed',
          context: 'general',
          slot: 'emblemFallback',
          purpose: '',
          customName: 'ignored-name',
        }),
      ).toBe('general-emblemfallback.png')
    })
  })

  describe('custom mode', () => {
    it('uses the free text, kebab-forced, extension preserved', () => {
      expect(
        buildUploadName(file('photo.JPG'), {
          mode: 'custom',
          context: '',
          slot: '',
          purpose: '',
          customName: 'Hero Alt Cut!',
        }),
      ).toBe('hero-alt-cut.jpg')
    })

    it('requires a non-blank custom name', () => {
      expect(
        buildUploadName(file('photo.jpg'), {
          mode: 'custom',
          context: '',
          slot: '',
          purpose: '',
          customName: '   ',
        }),
      ).toBeNull()
    })

    it('ignores context/slot while in custom mode', () => {
      expect(
        buildUploadName(file('a.png'), {
          mode: 'custom',
          context: 'nope',
          slot: 'whatever',
          purpose: 'unused',
          customName: 'my-file',
        }),
      ).toBe('my-file.png')
    })
  })
})
