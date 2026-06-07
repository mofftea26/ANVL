import { useEffect, type PropsWithChildren } from 'react'
import {
  DEFAULT_FONT_CONFIG,
  DEFAULT_THEME_CONFIG,
  fontConfigToCssVars,
  themeConfigToCssVars,
  type FontConfig,
  type ThemeConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'

type Props = PropsWithChildren<{
  theme?: ThemeConfig
  fonts?: FontConfig
}>

/**
 * Applies published theme + font tokens to :root via CSS custom properties.
 */
export function SiteThemeProvider({
  theme = DEFAULT_THEME_CONFIG,
  fonts = DEFAULT_FONT_CONFIG,
  children,
}: Props) {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme.dataTheme)
    const themeVars = themeConfigToCssVars(theme)
    const fontVars = fontConfigToCssVars(fonts)
    for (const [key, value] of Object.entries({ ...themeVars, ...fontVars })) {
      root.style.setProperty(key, value)
    }
    return () => {
      for (const key of Object.keys({ ...themeVars, ...fontVars })) {
        root.style.removeProperty(key)
      }
    }
  }, [theme, fonts])

  return <>{children}</>
}
