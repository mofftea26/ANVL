/** CSS custom properties for oath act presets — synced with landingActResponsive.css */

export const ACT_RESPONSIVE_STYLE = {
  '--act-display-size': 'clamp(1.2rem, 2.4cqi + 0.45rem, 1.875rem)',
  '--act-title-size': 'clamp(1.05rem, 2.1cqi + 0.4rem, 1.625rem)',
  '--act-subtitle-size': 'clamp(0.72rem, 0.85cqi + 0.32rem, 0.875rem)',
  '--act-eyebrow-size': 'clamp(0.54rem, 0.32cqi + 0.38rem, 0.65rem)',
  '--act-body-size': 'clamp(0.65rem, 0.5cqi + 0.48rem, 0.8125rem)',
  '--act-card-title-size': 'clamp(0.58rem, 0.45cqi + 0.42rem, 0.75rem)',
  '--act-card-body-size': 'clamp(0.52rem, 0.38cqi + 0.38rem, 0.65rem)',
  '--act-card-meta-size': 'clamp(0.48rem, 0.32cqi + 0.36rem, 0.58rem)',
  '--act-stat-size': 'clamp(0.78rem, 1cqi + 0.42rem, 1rem)',
  '--act-gap': 'clamp(0.45rem, 1cqi, 0.875rem)',
  '--act-gap-lg': 'clamp(0.55rem, 1.35cqi, 1.125rem)',
  '--act-card-radius': 'clamp(0.2rem, 0.4cqi, 0.4rem)',
  '--act-emblem-size': 'clamp(2.5rem, 6cqi, 5rem)',
  '--act-card-w': 'clamp(6.75rem, 16cqi, 9.5rem)',
  '--banner-w': 'clamp(5.75rem, 12.5cqi, 8.25rem)',
  '--banner-h': 'clamp(9.75rem, min(24cqi, calc(70svh - 14rem)), 12.25rem)',
} as const

export const ACT_RESPONSIVE_CLASS =
  'anvl-act-responsive gap-[var(--act-gap)] [&_[data-act-display]]:text-[length:var(--act-display-size)] [&_[data-act-title]]:text-[length:var(--act-title-size)] [&_[data-act-subtitle]]:text-[length:var(--act-subtitle-size)] [&_[data-act-eyebrow]]:text-[length:var(--act-eyebrow-size)] [&_[data-act-body]]:text-[length:var(--act-body-size)] [&_[data-act-card-title]]:text-[length:var(--act-card-title-size)] [&_[data-act-card-body]]:text-[length:var(--act-card-body-size)] [&_[data-act-card-meta]]:text-[length:var(--act-card-meta-size)]'

/** Apply to legacy landing sections that are not wrapped in ActPresetShell. */
export const LEGACY_ACT_SECTION_CLASS =
  'anvl-act-responsive anvl-screen-section relative w-full overflow-visible border-b border-[var(--color-line)]'
