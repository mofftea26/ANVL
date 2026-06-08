import { z } from 'zod'
import {
  DEFAULT_FONT_CONFIG,
  fontConfigSchema,
  type FontConfig,
} from './cmsSiteConfig.zod'

export const fontUploadFileSchema = z.object({
  url: z.string().url(),
  weight: z.number().int().min(100).max(900),
  style: z.enum(['normal', 'italic']),
  format: z.string().min(1),
})

export const fontFamilySourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('system'),
    family: z.string().min(1),
  }),
  z.object({
    kind: z.literal('google'),
    family: z.string().min(1),
  }),
  z.object({
    kind: z.literal('upload'),
    family: z.string().min(1),
    files: z.array(fontUploadFileSchema).min(1),
  }),
])

export const fontFamilyRecordSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  source: fontFamilySourceSchema,
})

export const fontLibraryConfigSchema = fontConfigSchema.extend({
  library: z.array(fontFamilyRecordSchema).default([]),
})

export type FontFamilySource = z.infer<typeof fontFamilySourceSchema>
export type FontFamilyRecord = z.infer<typeof fontFamilyRecordSchema>
export type FontLibraryConfig = z.infer<typeof fontLibraryConfigSchema>

export const BUILTIN_FONT_LIBRARY: FontFamilyRecord[] = [
  {
    id: 'builtin-sora',
    label: 'Sora',
    source: { kind: 'system', family: 'Sora' },
  },
  {
    id: 'builtin-anton',
    label: 'Anton',
    source: { kind: 'system', family: 'Anton' },
  },
  {
    id: 'builtin-cinzel',
    label: 'Cinzel',
    source: { kind: 'system', family: 'Cinzel' },
  },
]

/** Offline / empty-Supabase fallback — live values come from `storefront_publication.font_config`. */
export const DEFAULT_FONT_LIBRARY_CONFIG: FontLibraryConfig = {
  ...DEFAULT_FONT_CONFIG,
  sans: 'builtin-sora',
  heading: 'builtin-anton',
  display: 'builtin-cinzel',
  library: BUILTIN_FONT_LIBRARY,
}

export function parseFontLibrary(raw: unknown): FontLibraryConfig {
  const parsed = fontLibraryConfigSchema.safeParse(raw)
  if (parsed.success) {
    const library =
      parsed.data.library.length > 0 ? parsed.data.library : BUILTIN_FONT_LIBRARY
    return { ...parsed.data, library }
  }

  const legacy = fontConfigSchema.safeParse(raw)
  if (legacy.success) {
    const { sans, heading, display } = legacy.data
    const library = [...BUILTIN_FONT_LIBRARY]
    const resolveId = (name: string, slot: 'sans' | 'heading' | 'display') => {
      const builtin = library.find((f) => f.source.family === name)
      if (builtin) return builtin.id
      const id = `legacy-${slot}-${name.toLowerCase().replace(/\s+/g, '-')}`
      library.push({
        id,
        label: name,
        source: { kind: 'system', family: name },
      })
      return id
    }
    return {
      sans: resolveId(sans, 'sans'),
      heading: resolveId(heading, 'heading'),
      display: resolveId(display, 'display'),
      library,
    }
  }

  return DEFAULT_FONT_LIBRARY_CONFIG
}

export function resolveFontFamilyName(
  config: FontLibraryConfig,
  familyId: string,
): string {
  const record =
    config.library.find((f) => f.id === familyId) ??
    config.library.find((f) => f.source.family === familyId)
  if (record) return record.source.family
  if (familyId === config.sans || familyId === config.heading || familyId === config.display) {
    return familyId
  }
  return familyId
}

export function resolveFontConfig(config: FontLibraryConfig): FontConfig {
  return {
    sans: resolveFontFamilyName(config, config.sans),
    heading: resolveFontFamilyName(config, config.heading),
    display: resolveFontFamilyName(config, config.display),
  }
}

export function googleFontStylesheetUrl(family: string): string {
  const encoded = encodeURIComponent(family.trim()).replace(/%20/g, '+')
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700&display=swap`
}

export function buildUploadedFontFaceCss(record: FontFamilyRecord): string {
  if (record.source.kind !== 'upload') return ''
  const family = record.source.family
  return record.source.files
    .map(
      (file) =>
        `@font-face{font-family:"${family}";src:url("${file.url}") format("${file.format}");font-weight:${file.weight};font-style:${file.style};font-display:swap;}`,
    )
    .join('')
}

export function collectFontAssets(config: FontLibraryConfig): {
  googleFamilies: string[]
  uploadCss: string
} {
  const usedIds = new Set([config.sans, config.heading, config.display])
  const googleFamilies: string[] = []
  let uploadCss = ''

  for (const record of config.library) {
    if (!usedIds.has(record.id)) continue
    if (record.source.kind === 'google') {
      googleFamilies.push(record.source.family)
    }
    if (record.source.kind === 'upload') {
      uploadCss += buildUploadedFontFaceCss(record)
    }
  }

  return { googleFamilies: [...new Set(googleFamilies)], uploadCss }
}

export function fontLibraryToCssVars(config: FontLibraryConfig): Record<string, string> {
  const resolved = resolveFontConfig(config)
  return {
    '--font-sans': `"${resolved.sans}", ui-sans-serif, system-ui, sans-serif`,
    '--font-heading': `"${resolved.heading}", "Oswald", "Impact", sans-serif`,
    '--font-display': `"${resolved.display}", "Trajan Pro", "Anton", serif`,
  }
}

export function createGoogleFontRecord(family: string): FontFamilyRecord {
  const trimmed = family.trim()
  return {
    id: `google-${trimmed.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    label: trimmed,
    source: { kind: 'google', family: trimmed },
  }
}

export function createUploadFontRecord(
  family: string,
  files: z.infer<typeof fontUploadFileSchema>[],
): FontFamilyRecord {
  const trimmed = family.trim()
  return {
    id: `upload-${trimmed.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    label: trimmed,
    source: { kind: 'upload', family: trimmed, files },
  }
}

export function guessFontFormat(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'woff2') return 'woff2'
  if (ext === 'woff') return 'woff'
  if (ext === 'otf') return 'opentype'
  if (ext === 'ttf') return 'truetype'
  return 'truetype'
}

export function guessFontWeight(filename: string): number {
  const lower = filename.toLowerCase()
  if (lower.includes('thin')) return 100
  if (lower.includes('extralight') || lower.includes('ultralight')) return 200
  if (lower.includes('light')) return 300
  if (lower.includes('medium')) return 500
  if (lower.includes('semibold') || lower.includes('demibold')) return 600
  if (lower.includes('extrabold') || lower.includes('ultrabold')) return 800
  if (lower.includes('bold')) return 700
  if (lower.includes('black') || lower.includes('heavy')) return 900
  return 400
}

export function guessFontStyle(filename: string): 'normal' | 'italic' {
  return filename.toLowerCase().includes('italic') ? 'italic' : 'normal'
}
