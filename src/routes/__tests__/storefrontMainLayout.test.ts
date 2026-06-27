import { describe, expect, it } from 'vitest'
import { getStorefrontMainClassName } from '@/routes/storefrontMainLayout'

describe('getStorefrontMainClassName', () => {
  it('locks main during home entry (no chrome)', () => {
    expect(getStorefrontMainClassName({ showChrome: false, isHome: true })).toContain(
      'fixed inset-0',
    )
  })

  it('does not pad home main after entry — sections sit under the fixed header', () => {
    expect(
      getStorefrontMainClassName({ showChrome: true, isHome: true }),
    ).toBeUndefined()
  })

  it('pads non-home routes below the fixed header', () => {
    expect(getStorefrontMainClassName({ showChrome: true, isHome: false })).toBe(
      'pt-[var(--anvl-header-h)]',
    )
  })
})
