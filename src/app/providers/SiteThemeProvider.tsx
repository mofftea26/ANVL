import { useEffect, type PropsWithChildren } from 'react'
import { DEFAULT_FONT_LIBRARY_CONFIG } from '@/features/cms/config/fontLibrary'
import { DEFAULT_THEME_CONFIG, themeConfigToCssVars, type ThemeConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import {
  collectFontAssets,
  fontLibraryToCssVars,
  googleFontStylesheetUrl,
  parseFontLibrary,
  type FontLibraryConfig,
} from '@/features/cms/config/fontLibrary'

type Props = PropsWithChildren<{
  theme?: ThemeConfig
  fonts?: FontLibraryConfig | unknown
}>

/**
 * Applies published theme + font tokens to :root via CSS custom properties.
 */
export function SiteThemeProvider({
  theme = DEFAULT_THEME_CONFIG,
  fonts: fontsRaw = DEFAULT_FONT_LIBRARY_CONFIG,
  children,
}: Props) {
  const fonts = parseFontLibrary(fontsRaw)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme.dataTheme)
    const themeVars = themeConfigToCssVars(theme)
    const fontVars = fontLibraryToCssVars(fonts)
    for (const [key, value] of Object.entries({ ...themeVars, ...fontVars })) {
      root.style.setProperty(key, value)
    }

    const { googleFamilies, uploadCss } = collectFontAssets(fonts)
    const linkIds: string[] = []
    for (const family of googleFamilies) {
      const id = `anvl-google-font-${family.replace(/\s+/g, '-').toLowerCase()}`
      if (document.getElementById(id)) continue
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = googleFontStylesheetUrl(family)
      document.head.appendChild(link)
      linkIds.push(id)
    }

    let uploadStyle: HTMLStyleElement | null = null
    if (uploadCss) {
      uploadStyle = document.createElement('style')
      uploadStyle.setAttribute('data-anvl-uploaded-fonts', 'true')
      uploadStyle.textContent = uploadCss
      document.head.appendChild(uploadStyle)
    }

    return () => {
      for (const key of Object.keys({ ...themeVars, ...fontVars })) {
        root.style.removeProperty(key)
      }
      for (const id of linkIds) {
        document.getElementById(id)?.remove()
      }
      uploadStyle?.remove()
    }
  }, [theme, fonts])

  return <>{children}</>
}
