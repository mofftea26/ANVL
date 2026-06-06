import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ActiveDropThemeProvider,
  useStorefrontPublishedGlobalBrand,
} from '@/app/providers/ActiveDropThemeProvider'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'

function BrandProbe() {
  const brand = useStorefrontPublishedGlobalBrand()
  return <span>{brand?.emblemFallbackUrl ?? 'none'}</span>
}

describe('ActiveDropThemeProvider', () => {
  it('renders children without injecting a drop palette style tag', () => {
    const html = renderToStaticMarkup(
      <ActiveDropThemeProvider>
        <span>child</span>
      </ActiveDropThemeProvider>,
    )
    expect(html).toContain('child')
    expect(html).not.toContain('<style')
  })

  it('exposes the published global brand via context', () => {
    const brand = {
      ...createDefaultGlobalBrandSettings(),
      emblemFallbackUrl: '/brand/custom-emblem.svg',
    }
    const html = renderToStaticMarkup(
      <ActiveDropThemeProvider initialGlobalBrand={brand}>
        <BrandProbe />
      </ActiveDropThemeProvider>,
    )
    expect(html).toContain('/brand/custom-emblem.svg')
  })
})
