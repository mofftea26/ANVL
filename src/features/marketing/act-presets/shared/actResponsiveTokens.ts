/** CSS custom properties for oath act presets — use on section roots. */
export const ACT_RESPONSIVE_STYLE = {
  /* cqi tracks the act section container; upper bounds cap growth on ultrawide. */
  '--act-title-size': 'clamp(1.5rem, 3.5cqi + 0.75rem, 3.25rem)',
  '--act-subtitle-size': 'clamp(0.8125rem, 1cqi + 0.4rem, 1.0625rem)',
  '--act-eyebrow-size': 'clamp(0.625rem, 0.4cqi + 0.45rem, 0.7rem)',
  '--act-body-size': 'clamp(0.8125rem, 0.6cqi + 0.65rem, 1rem)',
  '--act-gap': 'clamp(0.625rem, 1.2cqi, 1.25rem)',
  '--act-gap-lg': 'clamp(0.875rem, 2cqi, 1.75rem)',
  '--act-card-radius': 'clamp(0.25rem, 0.5cqi, 0.5rem)',
  '--act-emblem-size': 'clamp(3rem, 8cqi, 6.5rem)',
} as const

export const ACT_RESPONSIVE_CLASS =
  'gap-[var(--act-gap)] [&_[data-act-title]]:text-[length:var(--act-title-size)] [&_[data-act-subtitle]]:text-[length:var(--act-subtitle-size)] [&_[data-act-eyebrow]]:text-[length:var(--act-eyebrow-size)] [&_[data-act-body]]:text-[length:var(--act-body-size)]'
