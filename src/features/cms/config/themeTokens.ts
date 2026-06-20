import { z } from 'zod'
import { mix, withAlpha } from '@/shared/lib/color'
import type { ThemePalette } from './cmsSiteConfig.zod'

/* -------------------------------------------------------------------------- *
 * Particle configuration (§9)
 *
 * Colors are derived from the normalized palette (accent/primary), the behavior
 * numbers describe the field's energy. Numbers are validated to safe ranges so a
 * CMS edit can never request a runaway density or blur.
 * -------------------------------------------------------------------------- */

export const themeParticleSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  highlight: z.string(),
  glow: z.string(),
  density: z.number().min(0).max(2),
  opacityMin: z.number().min(0).max(1),
  opacityMax: z.number().min(0).max(1),
  sizeMin: z.number().min(0).max(8),
  sizeMax: z.number().min(0).max(16),
  speedMin: z.number().min(0).max(2),
  speedMax: z.number().min(0).max(4),
  blur: z.number().min(0).max(4),
  connectionOpacity: z.number().min(0).max(1).optional(),
  trailOpacity: z.number().min(0).max(1).optional(),
})

export type ThemeParticleConfig = z.infer<typeof themeParticleSchema>

/** Oath Obsidian particle direction from the brand spec — the behavior baseline. */
export const DEFAULT_PARTICLE_BEHAVIOR = {
  density: 0.65,
  opacityMin: 0.08,
  opacityMax: 0.42,
  sizeMin: 0.5,
  sizeMax: 2.2,
  speedMin: 0.08,
  speedMax: 0.32,
  blur: 0.4,
} as const

/**
 * Build the particle config for a palette. Colors are derived from the brand
 * accent/primary so they always complement the active theme; mobile halves the
 * density to protect the GPU/battery budget (§20).
 */
export function finalizeThemeParticles(
  palette: ThemePalette,
  options: { mobile?: boolean } = {},
): ThemeParticleConfig {
  const densityScale = options.mobile ? 0.5 : 1
  return {
    primary: palette.accent,
    secondary: palette.primary,
    highlight: mix(palette.accent, '#ffffff', 0.24),
    glow: withAlpha(palette.accent, 0.2),
    ...DEFAULT_PARTICLE_BEHAVIOR,
    density: DEFAULT_PARTICLE_BEHAVIOR.density * densityScale,
  }
}

/* -------------------------------------------------------------------------- *
 * Scrollbar configuration (§11)
 * -------------------------------------------------------------------------- */

export const themeScrollbarSchema = z.object({
  track: z.string(),
  thumb: z.string(),
  thumbHover: z.string(),
  thumbActive: z.string(),
})

export type ThemeScrollbarConfig = z.infer<typeof themeScrollbarSchema>

/** Derived from the normalized palette surfaces/primary. */
export function finalizeThemeScrollbar(palette: ThemePalette): ThemeScrollbarConfig {
  return {
    track: mix(palette.card, palette.background, 0.12),
    thumb: mix(palette.primary, palette.foreground, 0.44),
    thumbHover: mix(palette.primary, palette.foreground, 0.32),
    thumbActive: palette.primary,
  }
}

/* -------------------------------------------------------------------------- *
 * Motion configuration (§18) — constant today, schema kept for §23 validation.
 * -------------------------------------------------------------------------- */

export const themeMotionSchema = z.object({
  durationFast: z.string(),
  durationNormal: z.string(),
  durationSlow: z.string(),
  easeStandard: z.string(),
  easeEmphasized: z.string(),
  easeExit: z.string(),
})

export type ThemeMotionConfig = z.infer<typeof themeMotionSchema>

export const DEFAULT_THEME_MOTION: ThemeMotionConfig = {
  durationFast: '140ms',
  durationNormal: '220ms',
  durationSlow: '320ms',
  easeStandard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeEmphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeExit: 'cubic-bezier(0.4, 0, 1, 1)',
}

/* -------------------------------------------------------------------------- *
 * CMS editor field grouping (§12)
 *
 * The editor renders these sections in order — a small, conventional palette.
 * Every other effect color is derived, so there is no "advanced/derived"
 * section to keep in sync.
 * -------------------------------------------------------------------------- */

export type ThemeEditorField = {
  key: keyof ThemePalette
  label: string
  /** Borders/inputs carry alpha — the field shows an opacity slider. */
  allowAlpha?: boolean
}

export type ThemeEditorSection = {
  id: string
  title: string
  description?: string
  fields: ThemeEditorField[]
}

export const THEME_EDITOR_SECTIONS: ThemeEditorSection[] = [
  {
    id: 'surfaces',
    title: 'Surfaces & text',
    description: 'Backgrounds, panels, and the text that sits on them.',
    fields: [
      { key: 'background', label: 'Background' },
      { key: 'foreground', label: 'Foreground (text)' },
      { key: 'card', label: 'Card / surface' },
      { key: 'cardForeground', label: 'Text on card' },
      { key: 'muted', label: 'Muted surface' },
      { key: 'mutedForeground', label: 'Muted text' },
      { key: 'border', label: 'Border', allowAlpha: true },
    ],
  },
  {
    id: 'brand',
    title: 'Brand',
    description: 'Primary commerce accent and the secondary storytelling accent.',
    fields: [
      { key: 'primary', label: 'Primary' },
      { key: 'primaryForeground', label: 'Text on primary' },
      { key: 'accent', label: 'Accent' },
      { key: 'accentForeground', label: 'Text on accent' },
      { key: 'ring', label: 'Focus ring' },
    ],
  },
  {
    id: 'status',
    title: 'Status',
    description: 'Semantic feedback colors.',
    fields: [
      { key: 'destructive', label: 'Destructive' },
      { key: 'success', label: 'Success' },
      { key: 'warning', label: 'Warning' },
    ],
  },
]

/** Pairs the CMS contrast report validates (§13). */
export type ContrastPair = {
  id: string
  label: string
  fg: keyof ThemePalette
  bg: keyof ThemePalette
  /** Minimum acceptable ratio (4.5 body, 3 large/controls). */
  min: number
}

export const THEME_CONTRAST_PAIRS: ContrastPair[] = [
  { id: 'text-bg', label: 'Foreground / background', fg: 'foreground', bg: 'background', min: 4.5 },
  { id: 'text-card', label: 'Foreground / card', fg: 'foreground', bg: 'card', min: 4.5 },
  { id: 'card-fg', label: 'Card text / card', fg: 'cardForeground', bg: 'card', min: 4.5 },
  { id: 'muted-bg', label: 'Muted text / background', fg: 'mutedForeground', bg: 'background', min: 4.5 },
  { id: 'muted-card', label: 'Muted text / card', fg: 'mutedForeground', bg: 'card', min: 4.5 },
  { id: 'on-primary', label: 'Text on primary / primary', fg: 'primaryForeground', bg: 'primary', min: 4.5 },
  { id: 'on-accent', label: 'Text on accent / accent', fg: 'accentForeground', bg: 'accent', min: 4.5 },
  { id: 'ring-bg', label: 'Focus ring / background', fg: 'ring', bg: 'background', min: 3 },
  { id: 'ring-card', label: 'Focus ring / card', fg: 'ring', bg: 'card', min: 3 },
]
