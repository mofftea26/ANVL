import { describe, expect, it } from 'vitest'
import { DEFAULT_FONT_LIBRARY_CONFIG } from '@/features/cms/config/fontLibrary'
import { DEFAULT_THEME_CONFIG } from '@/features/cms/config/cmsSiteConfig.zod'
import {
  buildPublishedFontPreloadLinks,
  publishedProjectionInlineCss,
  publishedThemeColor,
} from '@/features/cms/api/storefrontProjectionHead'

describe('storefrontProjectionHead', () => {
  it('inlines published theme and font CSS variables', () => {
    const css = publishedProjectionInlineCss(DEFAULT_THEME_CONFIG, DEFAULT_FONT_LIBRARY_CONFIG)
    expect(css).toContain('--color-bg:#0b0b0c')
    expect(css).toContain('--font-sans:"Sora"')
  })

  it('preloads bundled fonts referenced by the published library', () => {
    const links = buildPublishedFontPreloadLinks(DEFAULT_FONT_LIBRARY_CONFIG)
    expect(links).toHaveLength(3)
    expect(links.every((l) => l.rel === 'preload' && l.as === 'font')).toBe(true)
  })

  it('derives theme-color from published palette', () => {
    expect(publishedThemeColor(DEFAULT_THEME_CONFIG)).toBe('#0b0b0c')
  })
})
