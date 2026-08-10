import { SplitText } from '@/shared/lib/gsap'

/**
 * Split helper around GSAP SplitText (free since 3.13) — a deliberate clone of
 * TheOathLanding's `splitTextReveal`, kept feature-local for the same reason
 * as `aboutMotionHelpers` (no cross-feature coupling for a 12-line helper).
 *
 * `mask` wraps each unit in an overflow-clipped span (the masked-reveal look)
 * and SplitText's `aria: 'auto'` default keeps the original text readable to
 * assistive tech. Always call the returned `revert` in the matchMedia cleanup
 * so static branches get the untouched DOM back.
 */
export function splitUnits(
  el: HTMLElement,
  type: 'chars' | 'words' | 'lines',
): { units: HTMLElement[]; revert: () => void } {
  const split = SplitText.create(el, {
    type,
    mask: type,
  })
  const units = (
    type === 'chars' ? split.chars : type === 'words' ? split.words : split.lines
  ) as HTMLElement[]
  return { units, revert: () => split.revert() }
}
