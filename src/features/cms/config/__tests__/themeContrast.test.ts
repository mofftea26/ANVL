import { describe, expect, it } from 'vitest'
import { contrastRatio } from '@/shared/lib/color'
import {
  DEFAULT_THEME_CONFIG,
  DEFAULT_BONE_LIGHT_PALETTE,
  themeConfigToCssVars,
} from '@/features/cms/config/cmsSiteConfig.zod'

/**
 * WCAG AA guard for the SHIPPED default palettes.
 *
 * Why this test exists: the audit reported the primary CTA failing AA at
 * 3.70:1, measured against the code default (bronze accent + WHITE foreground).
 * The live published theme turned out to use a different accent and a near-black
 * foreground and already passed — but the DEFAULT was genuinely non-compliant,
 * and a theme reset, a fresh environment, or the bone-light preset would all
 * have shipped it. Numbers in a review doc go stale; an assertion does not.
 *
 * The thresholds are the real WCAG AA ones:
 *   - 4.5:1 for normal text
 *   - 3:1 for large text (>=24px, or >=18.66px bold)
 * The primary button renders `text-sm font-semibold` = 14px/600, which is
 * NORMAL text — it does NOT get the large-text allowance. So 4.5:1 applies.
 */
const AA_NORMAL_TEXT = 4.5
const AA_NON_TEXT = 3

const palettes = {
  'oath-dark (default)': DEFAULT_THEME_CONFIG.palette,
  'bone-light': DEFAULT_BONE_LIGHT_PALETTE,
} as const

describe.each(Object.entries(palettes))('%s — WCAG AA', (_name, palette) => {
  it('body text on the page background passes AA for normal text', () => {
    expect(contrastRatio(palette.foreground, palette.background)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    )
  })

  it('card text on the card surface passes AA for normal text', () => {
    expect(contrastRatio(palette.cardForeground, palette.card)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    )
  })

  it('PRIMARY CTA text passes AA against BOTH ends of its gradient', () => {
    // Button.tsx primary: `bg-gradient-to-b from-[--color-highlight-bright]
    // to-[--color-highlight]` with `text-[--color-on-highlight]`. One text
    // colour has to survive both stops, so both are asserted — checking only
    // the base colour is what let the lighter top slip through at 2.61:1.
    const vars = themeConfigToCssVars({ ...DEFAULT_THEME_CONFIG, palette })
    const onHighlight = vars['--color-on-highlight']!
    const highlight = vars['--color-highlight']!
    const highlightBright = vars['--color-highlight-bright']!

    expect(contrastRatio(onHighlight, highlight)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(onHighlight, highlightBright)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    )
  })

  it('primary-button text passes AA on the primary surface', () => {
    expect(
      contrastRatio(palette.primaryForeground, palette.primary),
    ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('status colours are distinguishable against the background (non-text, 3:1)', () => {
    // Badges and status dots are non-text UI components under SC 1.4.11.
    for (const key of ['destructive', 'success', 'warning'] as const) {
      expect(contrastRatio(palette[key], palette.background)).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      )
    }
  })
})

describe('the specific regression the audit found', () => {
  it('white on the default accent would FAIL — proving the guard is real', () => {
    // Pinning the counter-example: if someone sets accentForeground back to
    // white, the CTA test above starts failing rather than silently regressing.
    const { accent } = DEFAULT_THEME_CONFIG.palette
    expect(contrastRatio('#ffffff', accent)).toBeLessThan(AA_NORMAL_TEXT)
  })

  it('the shipped default now clears AA on the accent', () => {
    const { accent, accentForeground } = DEFAULT_THEME_CONFIG.palette
    expect(contrastRatio(accentForeground, accent)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    )
  })
})
