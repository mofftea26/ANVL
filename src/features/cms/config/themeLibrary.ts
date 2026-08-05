import { z } from 'zod'
import { bestForeground, mix } from '@/shared/lib/color'
import {
  collectPaletteOverrides,
  DEFAULT_BONE_LIGHT_PALETTE,
  DEFAULT_THEME_PALETTE,
  themeModeSchema,
  themePaletteSchema,
  type ThemeConfig,
  type ThemeMode,
  type ThemePalette,
} from './cmsSiteConfig.zod'
import { ANVL_THEME_PRESETS, type RawThemePreset } from './themePresets'

export const themeAppearanceSchema = z.enum(['dark', 'light'])

export const themePresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  appearance: themeAppearanceSchema,
  palette: themePaletteSchema,
  /** Marks the recommended Drop 01 launch theme (§4.1). */
  recommended: z.boolean().optional(),
  description: z.string().optional(),
  recommendedFor: z.array(z.string()).optional(),
})

export const themeLibraryConfigSchema = z.object({
  activeThemeId: z.string().min(1),
  themes: z.array(themePresetSchema).min(1),
})

export type ThemeAppearance = z.infer<typeof themeAppearanceSchema>
export type ThemePreset = z.infer<typeof themePresetSchema>
export type ThemeLibraryConfig = z.infer<typeof themeLibraryConfigSchema>

export const DEFAULT_THEME_PRESET_ID = 'graphite-champagne'

/**
 * Preset ids retired on 2026-07-12 when the library consolidated to the single
 * Graphite & Champagne house theme. Stored copies of these (published library
 * rows, localStorage working copies) are dropped on parse so the retired looks
 * cannot linger; an `activeThemeId` pointing at one is remapped to the house
 * preset. Genuinely user-created themes (ids like `theme-<timestamp>`) are
 * untouched.
 */
const RETIRED_THEME_IDS = new Set([
  'oath-dark-default',
  'bone-light-default',
  'oath-obsidian',
  'blackened-champagne',
  'oxblood-covenant',
  'burnished-bronze',
  'cold-forged-steel',
  'ashen-olive',
  'midnight-cobalt',
  'blackened-teal',
  'iron-violet',
  'bone-relic',
  'theoath-modern-tech-forge',
  'forged-ceremonial',
])

export function appearanceToDataTheme(appearance: ThemeAppearance): ThemeMode {
  return appearance === 'light' ? 'bone-light' : 'oath-dark'
}

/**
 * Fill a palette into a complete, normalized 15-token set.
 *
 * Accepts current, pre-consolidation, or pre-ember-rename shapes — legacy keys
 * are mapped onto the normalized palette. Anything the editor/preset did not set
 * explicitly is derived from the appearance default + the palette's own colors:
 * foregrounds are contrast-chosen (never assume white) and the muted surface is
 * mixed from the card so it tracks custom themes. Explicit values always win
 * (fill-only) so editor edits stick.
 */
export function finalizeThemePalette(
  input: Partial<ThemePalette> | Record<string, unknown> | undefined,
  appearance: ThemeAppearance,
): ThemePalette {
  const base = appearance === 'light' ? DEFAULT_BONE_LIGHT_PALETTE : DEFAULT_THEME_PALETTE
  const overrides = collectPaletteOverrides(input ?? {})
  const provided = (key: keyof ThemePalette) => overrides[key] !== undefined
  const p: ThemePalette = { ...base, ...overrides }

  // Muted surface tracks the card so custom themes stay cohesive.
  if (!provided('muted')) p.muted = mix(p.card, p.foreground, 0.05)
  // Contrast-chosen foregrounds for colored surfaces — never assume white.
  if (!provided('cardForeground')) p.cardForeground = p.foreground
  if (!provided('primaryForeground')) p.primaryForeground = bestForeground(p.primary)
  if (!provided('accentForeground')) p.accentForeground = bestForeground(p.accent)
  // Focus ring follows the primary brand color by default.
  if (!provided('ring')) p.ring = p.primary

  return p
}

/** Finalize a brand-authored raw preset into a complete `ThemePreset`. */
export function buildPreset(raw: RawThemePreset): ThemePreset {
  return {
    id: raw.key,
    name: raw.label,
    appearance: raw.appearance,
    palette: finalizeThemePalette(raw.palette, raw.appearance),
    recommended: raw.recommended,
    description: raw.description,
    recommendedFor: raw.recommendedFor,
  }
}

/** All brand-authored presets, finalized (§4). */
export const ANVL_PRESETS: ThemePreset[] = ANVL_THEME_PRESETS.map(buildPreset)

/**
 * Offline / empty-Supabase fallback — live values come from
 * `storefront_publication.theme_config`.
 *
 * Ships only the Graphite & Champagne house preset (the active default). The
 * legacy oath-dark/bone-light entries and the exploration preset set are
 * retired (`RETIRED_THEME_IDS`).
 */
export const DEFAULT_THEME_LIBRARY: ThemeLibraryConfig = {
  activeThemeId: DEFAULT_THEME_PRESET_ID,
  themes: [...ANVL_PRESETS],
}

export function presetToThemeConfig(preset: ThemePreset): ThemeConfig {
  return {
    dataTheme: appearanceToDataTheme(preset.appearance),
    palette: preset.palette,
  }
}

/**
 * Resolve the single global theme for the whole storefront. The live
 * `activeThemeId` drives every surface — there is no per-landing-page override.
 */
export function resolveThemeConfig(library: ThemeLibraryConfig): ThemeConfig {
  const active =
    library.themes.find((t) => t.id === library.activeThemeId) ?? library.themes[0]
  return presetToThemeConfig(active)
}

/**
 * Guarantee the built-in house preset is always present, drop retired presets,
 * and finalize every palette for the current token set. User-customized themes
 * that share a built-in id are preserved (their edits win); an `activeThemeId`
 * pointing at a retired/missing theme is remapped to the house preset.
 */
function withBuiltInPresets(library: ThemeLibraryConfig): ThemeLibraryConfig {
  const kept = library.themes.filter((t) => !RETIRED_THEME_IDS.has(t.id))
  const byId = new Map<string, ThemePreset>()
  for (const preset of ANVL_PRESETS) byId.set(preset.id, preset)
  for (const theme of kept) {
    byId.set(theme.id, {
      ...theme,
      palette: finalizeThemePalette(theme.palette, theme.appearance),
    })
  }
  // Built-ins first (stable order), then any extra user themes.
  const builtInIds = new Set(ANVL_PRESETS.map((p) => p.id))
  const themes = [
    ...ANVL_PRESETS.map((p) => byId.get(p.id)!),
    ...kept.filter((t) => !builtInIds.has(t.id)).map((t) => byId.get(t.id)!),
  ]
  const activeThemeId = themes.some((t) => t.id === library.activeThemeId)
    ? library.activeThemeId
    : DEFAULT_THEME_PRESET_ID
  return { activeThemeId, themes }
}

export function parseThemeLibrary(raw: unknown): ThemeLibraryConfig {
  const parsed = themeLibraryConfigSchema.safeParse(raw)
  if (parsed.success) return withBuiltInPresets(parsed.data)

  if (raw && typeof raw === 'object' && 'themes' in raw && 'activeThemeId' in raw) {
    const loose = raw as ThemeLibraryConfig
    if (Array.isArray(loose.themes) && loose.themes.length > 0) {
      return withBuiltInPresets({
        activeThemeId: loose.activeThemeId || loose.themes[0].id,
        themes: loose.themes.map((t) => ({
          id: t.id,
          name: t.name,
          appearance: t.appearance === 'light' ? 'light' : 'dark',
          palette: finalizeThemePalette(
            t.palette,
            t.appearance === 'light' ? 'light' : 'dark',
          ),
        })),
      })
    }
  }

  const legacyMode = themeModeSchema.safeParse(
    raw && typeof raw === 'object' && 'dataTheme' in raw
      ? (raw as { dataTheme?: string }).dataTheme
      : undefined,
  )
  const legacyPalette =
    raw && typeof raw === 'object' && 'palette' in raw
      ? (raw as { palette?: unknown }).palette
      : undefined

  if (legacyMode.success) {
    const appearance: ThemeAppearance =
      legacyMode.data === 'bone-light' ? 'light' : 'dark'
    // `finalizeThemePalette` maps legacy keys + fills gaps from the appearance
    // default. The legacy ids are retired, so `withBuiltInPresets` drops the
    // reconstructed entry and the library collapses to the house preset —
    // pre-consolidation configs migrate forward instead of resurrecting the
    // old look under the new id.
    const palette = finalizeThemePalette(legacyPalette ?? {}, appearance)
    const id =
      legacyMode.data === 'bone-light' ? 'bone-light-default' : 'oath-dark-default'
    return withBuiltInPresets({
      activeThemeId: id,
      themes: [
        {
          id,
          name: legacyMode.data === 'bone-light' ? 'Bone light (legacy)' : 'Oath dark (legacy)',
          appearance,
          palette,
        },
      ],
    })
  }

  return DEFAULT_THEME_LIBRARY
}

export function createThemePreset(name: string, appearance: ThemeAppearance): ThemePreset {
  const base = appearance === 'light' ? DEFAULT_BONE_LIGHT_PALETTE : DEFAULT_THEME_PALETTE
  // `finalizeThemePalette` is FILL-ONLY: an explicitly-present foreground
  // suppresses its `bestForeground()` contrast gate. Both defaults spell
  // `accentForeground` out literally, so seeding straight from them meant every
  // admin-created theme inherited that value verbatim with the WCAG gate never
  // running — which is how a preset carrying white on #c2703d (3.70:1) came to
  // exist in the live theme library. Dropping the two DERIVED foregrounds lets
  // the gate choose them, exactly as the house presets rely on.
  const seed: Partial<ThemePalette> = { ...base }
  delete seed.accentForeground
  delete seed.primaryForeground
  const palette = finalizeThemePalette(seed, appearance)
  return {
    id: `theme-${Date.now()}`,
    name,
    appearance,
    palette,
  }
}

export function parseThemeConfigFromLibraryRaw(raw: unknown): ThemeConfig {
  if (raw && typeof raw === 'object' && !('themes' in raw)) {
    const r = z
      .object({ dataTheme: themeModeSchema, palette: themePaletteSchema })
      .safeParse(raw)
    if (r.success) return r.data
  }
  return resolveThemeConfig(parseThemeLibrary(raw))
}
