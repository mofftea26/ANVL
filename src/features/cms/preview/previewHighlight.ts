import type { PreviewTarget } from './previewBridge.types'

export const PREVIEW_TARGET_ATTR = 'data-anvl-preview-target'

/**
 * The DOM attr carries only the id — `kind` is admin-side metadata. One
 * element can then be rung by both its asset-slot and content-field editors
 * (e.g. the About hero's image slot and its copy fields share `about:hero`).
 */
export function previewTargetValue(target: PreviewTarget): string {
  return target.id
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

let hoverEl: HTMLElement | null = null

/**
 * Inspection-style hover highlight: ring stays on while the admin hovers the
 * matching editor field, clears on hover-out (`target: null`). Scrolls the
 * element into view instantly (a small preview viewport rarely shows it
 * otherwise) — like hovering a node in browser devtools.
 */
export function setPreviewHoverTarget(target: PreviewTarget | null): boolean {
  if (hoverEl) {
    hoverEl.classList.remove(RING_CLASS)
    hoverEl = null
  }
  if (!target) return true

  const el = findTargetElement(target)
  if (!el) return false

  ensureRingStyles()
  if (ringTimer) clearTimeout(ringTimer)
  el.scrollIntoView({ behavior: 'auto', block: 'center' })
  el.classList.add(RING_CLASS)
  hoverEl = el
  return true
}
