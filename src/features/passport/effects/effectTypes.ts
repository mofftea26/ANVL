import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import type { PassportSectionKey } from '../components/console/passportSections'
import type { PassportEffectFacts } from './effectFacts'

/**
 * The passport section-effect seam.
 *
 * Every passport section gets a signature ambient effect — the Blueprint's
 * hologram is the reference — and they all plug in through this one contract
 * so the console, the mobile sheet and the armory tab mount them identically.
 * Effects are lazy (`PassportSectionEffectLayer` owns the imports), mounted
 * one at a time (only the ACTIVE section's), and render into an absolutely
 * positioned, pointer-events-none layer over the product stage (sections) or
 * behind the panel content (armory).
 *
 * Rules every effect implementation observes (enforced by review, stated here
 * so they live next to the contract):
 * - Colors come from CSS variables at runtime — never hardcoded hues. The
 *   blueprint hologram's blueprint-blue is the one sanctioned deviation.
 * - `useReducedMotion()` ⇒ a STILL composition (or nothing), never a
 *   stripped-down animation.
 * - three.js only behind a lazy gate (the `PassportForgeGate` pattern), so it
 *   stays in `vendor-three`; canvas 2D for everything lighter.
 * - Full cleanup: rAF, observers, GSAP (via `useGSAP`), listeners.
 */

/** Sections plus the armory tab, which is one composed surface, not a card. */
export type PassportEffectKey = PassportSectionKey | 'armory'

export interface PassportEffectProps {
  /** Which surface this instance decorates. One effect module per key — no shared variants. */
  sectionKey: PassportEffectKey
  /** The stage/hero product image, when the layout has one. May be null. */
  imageUrl: string | null
  /**
   * The section's REAL authored readouts (see `effectFacts.ts`).
   *
   * Optional so an effect can be rendered — and unit-tested — without a
   * passport behind it; absent or empty means the same thing as a failed
   * silhouette sample: show the non-data composition, never a plausible
   * invention. Hosts always pass it.
   */
  facts?: PassportEffectFacts
  /**
   * `console` = the ≥1280px fixed console (larger canvas budget);
   * `sheet` = the mobile page (lighter variants, roughly half the elements).
   */
  tier: 'console' | 'sheet'
}

/** Matches `PassportForgeGate`'s console gate — kept in lockstep by test. */
export const PASSPORT_EFFECT_CONSOLE_MQ =
  '(min-width: 1280px) and (prefers-reduced-motion: no-preference)'

export interface PassportEffectMode {
  reducedMotion: boolean
  /** True once WebGL capability is confirmed post-mount (SSR-safe: starts false). */
  webglOk: boolean
}

/** Capability snapshot shared by the hosts and the heavier effects. */
export function usePassportEffectMode(): PassportEffectMode {
  const reducedMotion = useReducedMotion()
  const [webglOk, setWebglOk] = useState(false)
  useEffect(() => {
    setWebglOk(isWebglAvailable())
  }, [])
  return { reducedMotion, webglOk }
}

/**
 * Whether the WebGL blueprint hologram will mount at all.
 *
 * The console host needs this decision too — not just the effect — because the
 * CSS `.pp-holo` treatment is the hologram's FALLBACK: it must arm exactly
 * when the canvas does not (reduced motion, no WebGL, or below the console
 * breakpoint), and go dark when the canvas takes over. One hook, two
 * consumers, so the two gates cannot drift.
 */
export function useBlueprintHologramGate(): boolean {
  const [mqOk, setMqOk] = useState(false)
  const { webglOk } = usePassportEffectMode()
  useEffect(() => {
    const mq = window.matchMedia(PASSPORT_EFFECT_CONSOLE_MQ)
    const update = () => setMqOk(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mqOk && webglOk
}
