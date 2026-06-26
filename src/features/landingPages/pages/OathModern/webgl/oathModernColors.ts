import * as THREE from 'three'

/**
 * Shader/material palette for The Oath Modern scene, read once from the brand CSS
 * variables so CMS theme edits flow into the GL world on next mount — never
 * hardcoded. The same source of truth as the storefront chrome
 * (`themeConfigToCssVars`), so the forged world cannot drift from the page.
 *
 * NOTE the theme mapping: `--color-accent` is the wax-metal vow accent (the
 * palette `primary`), `--color-highlight` is the oxidized iron (the palette
 * `accent`). Fallbacks match the `forged-ceremonial` preset.
 */
export interface OathModernColors {
  /** Forged void background. */
  bg: THREE.Color
  /** Forged surface (the monument body). */
  surface: THREE.Color
  /** Bone — text/key highlights on the monument. */
  bone: THREE.Color
  /** Wax-metal — the warm key light + the vow accent. */
  wax: THREE.Color
  /** Oxidized iron — cool secondary tone. */
  iron: THREE.Color
  /** Bone-grey dust motes. */
  dust: THREE.Color
}

const FALLBACKS = {
  bg: '#07070A',
  surface: '#1A1B1E',
  bone: '#E7E4DF',
  wax: '#B98A4E',
  iron: '#6E5A48',
  dust: '#E7E4DF',
} as const

function cssColor(varName: string, fallback: string): THREE.Color {
  if (typeof window === 'undefined') return new THREE.Color(fallback)
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  try {
    return new THREE.Color(raw || fallback)
  } catch {
    return new THREE.Color(fallback)
  }
}

export function readOathModernColors(): OathModernColors {
  return {
    bg: cssColor('--color-bg', FALLBACKS.bg),
    surface: cssColor('--color-surface-elevated', FALLBACKS.surface),
    bone: cssColor('--color-heading', FALLBACKS.bone),
    wax: cssColor('--color-accent', FALLBACKS.wax),
    iron: cssColor('--color-highlight', FALLBACKS.iron),
    dust: cssColor('--particle-primary', FALLBACKS.dust),
  }
}
