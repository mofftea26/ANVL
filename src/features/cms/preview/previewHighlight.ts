import type { PreviewTarget } from './previewBridge.types'

export const PREVIEW_TARGET_ATTR = 'data-anvl-preview-target'

export function previewTargetValue(target: PreviewTarget): string {
  return `${target.kind}:${target.id}`
}

const RING_CLASS = 'anvl-preview-ring'
const RING_STYLE_ID = 'anvl-preview-ring-style'
const RING_DURATION_MS = 2400

/** Injected on demand (preview mode only) — brand-token accent ring + pulse. */
const RING_CSS = `
.${RING_CLASS} {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
  border-radius: 6px;
  animation: anvl-preview-ring-pulse 0.9s ease-out 2;
}
@keyframes anvl-preview-ring-pulse {
  0% { outline-offset: 10px; outline-color: color-mix(in srgb, var(--color-accent) 45%, transparent); }
  100% { outline-offset: 4px; outline-color: var(--color-accent); }
}
@media (prefers-reduced-motion: reduce) {
  .${RING_CLASS} { animation: none; }
}
`

function ensureRingStyles() {
  if (document.getElementById(RING_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = RING_STYLE_ID
  style.textContent = RING_CSS
  document.head.appendChild(style)
}

let ringTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Landing scene targets (`the-oath:<scene>`) resolve against the Oath's
 * existing `data-scene` DOM contract instead of new attributes, so the
 * cinematic components stay untouched.
 */
const LANDING_SCENE_TARGET = /^the-oath:(hero|manifesto|tenets|products|finale)$/

function findTargetElement(target: PreviewTarget): HTMLElement | null {
  const selector = `[${PREVIEW_TARGET_ATTR}="${CSS.escape(previewTargetValue(target))}"]`
  const direct = document.querySelector<HTMLElement>(selector)
  if (direct) return direct
  const scene = target.id.match(LANDING_SCENE_TARGET)?.[1]
  if (scene) return document.querySelector<HTMLElement>(`[data-scene="${scene}"]`)
  return null
}

/**
 * Scroll the target's element into view and flash the highlight ring.
 * Returns whether an element was found (reported back to the admin).
 */
export function highlightPreviewTarget(target: PreviewTarget): boolean {
  const el = findTargetElement(target)
  if (!el) return false

  ensureRingStyles()
  for (const stale of document.querySelectorAll(`.${RING_CLASS}`)) {
    stale.classList.remove(RING_CLASS)
  }
  if (ringTimer) clearTimeout(ringTimer)

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  el.classList.add(RING_CLASS)
  ringTimer = setTimeout(() => el.classList.remove(RING_CLASS), RING_DURATION_MS)
  return true
}
