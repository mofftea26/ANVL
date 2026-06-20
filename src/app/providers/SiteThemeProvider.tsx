import { useEffect, useMemo, useSyncExternalStore, type PropsWithChildren } from 'react'
import { DEFAULT_FONT_LIBRARY_CONFIG } from '@/features/cms/config/fontLibrary'
import { DEFAULT_THEME_CONFIG, themeConfigToCssVars, type ThemeConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import {
  collectFontAssets,
  fontLibraryToCssVars,
  googleFontStylesheetUrl,
  parseFontLibrary,
  type FontLibraryConfig,
} from '@/features/cms/config/fontLibrary'
import {
  DEFAULT_THEME_LIBRARY,
  resolveThemeConfig,
} from '@/features/cms/config/themeLibrary'
import {
  hasStoredThemeLibrary,
  readFontLibraryFromStorage,
  readThemeLibraryFromStorage,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

type Props = PropsWithChildren<{
  theme?: ThemeConfig
  fonts?: FontLibraryConfig | unknown
}>

/**
 * Applies published theme + font tokens to `<html>` via CSS custom properties.
 *
 * Source of truth (resolved per browser):
 * - **This browser has a local CMS draft** (the `/admin` editors write one on
 *   every save) → apply it, so "save in CMS → see it on the storefront" always
 *   holds for the editing browser, even if the published projection read fails.
 * - **No usable Supabase env (local dev)** → also use the local config.
 * - **Otherwise** → the published projection (`theme`/`fonts` props) wins; this
 *   is what every real visitor sees (they never have this localStorage).
 */
export function SiteThemeProvider({
  theme = DEFAULT_THEME_CONFIG,
  fonts: fontsRaw = DEFAULT_FONT_LIBRARY_CONFIG,
  children,
}: Props) {
  const noSupabase = getSupabasePublicEnv() === null
  const hasLocalDraft = useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    hasStoredThemeLibrary,
    () => false,
  )
  const useLocalConfig = noSupabase || hasLocalDraft

  const localThemeLibrary = useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    readThemeLibraryFromStorage,
    () => DEFAULT_THEME_LIBRARY,
  )
  const localFontLibrary = useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    readFontLibraryFromStorage,
    () => DEFAULT_FONT_LIBRARY_CONFIG,
  )

  const effectiveTheme = useMemo(
    () => (useLocalConfig ? resolveThemeConfig(localThemeLibrary) : theme),
    [useLocalConfig, localThemeLibrary, theme],
  )
  const fonts = useMemo(
    () => parseFontLibrary(useLocalConfig ? localFontLibrary : fontsRaw),
    [useLocalConfig, localFontLibrary, fontsRaw],
  )

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', effectiveTheme.dataTheme)

    // Write the token set as inline custom properties on <html>. The SSR first
    // paint already set these inline (highest specificity); a `:root{}` <style>
    // tag (specificity 0,1,0) can't override that inline declaration, so a
    // client-side theme change would silently keep the old palette. Setting the
    // same inline properties here updates them in place and always wins over the
    // SSR payload and the `styles.css` `:root[data-theme]` bootstrap defaults.
    const vars = { ...themeConfigToCssVars(effectiveTheme), ...fontLibraryToCssVars(fonts) }
    for (const [key, value] of Object.entries(vars)) {
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
      for (const id of linkIds) {
        document.getElementById(id)?.remove()
      }
      uploadStyle?.remove()
    }
  }, [effectiveTheme, fonts])

  return <>{children}</>
}
