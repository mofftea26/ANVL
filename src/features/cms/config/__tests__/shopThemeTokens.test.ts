import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME_CONFIG,
  themeConfigToCssVars,
} from '@/features/cms/config/cmsSiteConfig.zod'

describe('themeConfigToCssVars — shop semantic layer', () => {
  const vars = themeConfigToCssVars(DEFAULT_THEME_CONFIG)

  it('emits the full --shop-* token set derived from the palette', () => {
    const expected = [
      '--shop-bg',
      '--shop-surface',
      '--shop-surface-elevated',
      '--shop-card-bg',
      '--shop-card-bg-2',
      '--shop-card-border',
      '--shop-card-border-soft',
      '--shop-text',
      '--shop-text-muted',
      '--shop-accent',
      '--shop-on-accent',
      '--shop-focus',
      '--shop-overlay',
      '--shop-card-glow',
      '--shop-card-light',
      '--shop-image-bg',
      '--shop-skeleton-from',
      '--shop-skeleton-to',
      '--shop-success',
      '--shop-warning',
      '--shop-out-of-stock',
      '--shop-chip-selected',
      '--shop-hover-surface',
    ]
    for (const key of expected) {
      expect(vars[key], `missing ${key}`).toBeTruthy()
    }
  })

  it('binds core shop tokens straight to the palette source of truth', () => {
    expect(vars['--shop-bg']).toBe(DEFAULT_THEME_CONFIG.palette.background)
    expect(vars['--shop-text']).toBe(DEFAULT_THEME_CONFIG.palette.foreground)
    expect(vars['--shop-accent']).toBe(DEFAULT_THEME_CONFIG.palette.accent)
  })
})
