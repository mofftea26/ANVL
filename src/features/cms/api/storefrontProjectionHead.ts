import antonLatinWoff2 from '@fontsource/anton/files/anton-latin-400-normal.woff2?url'
import cinzelLatinWoff2 from '@fontsource/cinzel/files/cinzel-latin-600-normal.woff2?url'
import soraLatinWoff2 from '@fontsource/sora/files/sora-latin-400-normal.woff2?url'
import {
  fontLibraryToCssVars,
  parseFontLibrary,
  resolveFontConfig,
  type FontLibraryConfig,
} from '@/features/cms/config/fontLibrary'
import {
  themeConfigToCssVars,
  type ThemeConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'

/** Bundled @fontsource files for built-in system families (offline fallback preloads). */
const BUILTIN_FONT_PRELOAD_URLS: Record<string, string> = {
  Sora: soraLatinWoff2,
  Anton: antonLatinWoff2,
  Cinzel: cinzelLatinWoff2,
}

function cssVarsBlock(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
  return `:root{${body}}`
}

/** Inline SSR theme + font tokens from published Supabase projection. */
export function publishedProjectionInlineCss(
  theme: ThemeConfig,
  fonts: FontLibraryConfig | unknown,
): string {
  const library = parseFontLibrary(fonts)
  return cssVarsBlock({
    ...themeConfigToCssVars(theme),
    ...fontLibraryToCssVars(library),
  })
}

export type FontPreloadLink = {
  rel: 'preload'
  href: string
  as: 'font'
  type: 'font/woff2'
  crossOrigin: 'anonymous'
}

/** Preload bundled fonts only when the published library references them. */
export function buildPublishedFontPreloadLinks(
  fonts: FontLibraryConfig | unknown,
): FontPreloadLink[] {
  const resolved = resolveFontConfig(parseFontLibrary(fonts))
  const families = new Set([resolved.sans, resolved.heading, resolved.display])
  const links: FontPreloadLink[] = []

  for (const family of families) {
    const href = BUILTIN_FONT_PRELOAD_URLS[family]
    if (!href) continue
    links.push({
      rel: 'preload',
      href,
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    })
  }

  return links
}

export function publishedThemeColor(theme: ThemeConfig): string {
  return theme.palette.colorBg || theme.palette.anvlBlack
}
