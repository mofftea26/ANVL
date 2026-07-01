import * as THREE from 'three'

export interface AboutBrandColors {
  bg: THREE.Color
  /** Theme-driven emblem/light tone — follows the CMS heading color so the 3D
   *  monument is controlled by the active theme (falls back to bone). */
  emblem: THREE.Color
  /** Normalized palette primary/accent — used for the finale colour gradient so
   *  it separates from the (heading-coloured) finale copy. */
  primary: THREE.Color
  accent: THREE.Color
  /** Theme-aware particle palette. Falls back to bone so the dust keeps its
   *  warm-bone identity unless a theme assigns different particle tokens. */
  particlePrimary: THREE.Color
  particleSecondary: THREE.Color
  particleHighlight: THREE.Color
}

const FALLBACKS = {
  bg: '#0B0B0C',
  bone: '#E7E4DF',
  primary: '#8a8d90',
  accent: '#c2703d',
  particlePrimary: '#E7E4DF',
  particleSecondary: '#E7E4DF',
  particleHighlight: '#E7E4DF',
} as const

function cssColor(varName: string, fallback: string): THREE.Color {
  if (typeof window === 'undefined') return new THREE.Color(fallback)
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  try {
    return new THREE.Color(raw || fallback)
  } catch {
    return new THREE.Color(fallback)
  }
}

/**
 * Shader palette read once from the brand CSS variables, so CMS theme edits
 * flow into the GL scene on next mount — never hardcoded neon. Mirrors
 * `oathBrandColors.ts`.
 */
export function readAboutBrandColors(): AboutBrandColors {
  return {
    bg: cssColor('--color-bg', FALLBACKS.bg),
    emblem: cssColor('--color-heading', FALLBACKS.bone),
    primary: cssColor('--color-primary', FALLBACKS.primary),
    accent: cssColor('--color-accent', FALLBACKS.accent),
    particlePrimary: cssColor('--particle-primary', FALLBACKS.particlePrimary),
    particleSecondary: cssColor('--particle-secondary', FALLBACKS.particleSecondary),
    particleHighlight: cssColor('--particle-highlight', FALLBACKS.particleHighlight),
  }
}
