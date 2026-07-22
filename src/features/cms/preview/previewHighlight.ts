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
const OVERLAY_CLASS = 'anvl-preview-overlay'
const RING_STYLE_ID = 'anvl-preview-ring-style'
const RING_DURATION_MS = 2400

/**
 * Injected on demand (preview mode only) — brand-token highlight:
 * a 1.5px accent outline on the element itself plus a translucent
 * copper-tinted overlay div covering the element's exact bounds (content
 * stays readable through it). Reduced motion: no pulse.
 */
const RING_CSS = `
.${RING_CLASS} {
  outline: 1.5px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 6px;
  animation: anvl-preview-ring-pulse 0.9s ease-out 2;
}
.${OVERLAY_CLASS} {
  position: fixed;
  pointer-events: none;
  z-index: 2147483000;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  outline: 1.5px solid color-mix(in srgb, var(--color-accent) 70%, transparent);
  outline-offset: -1.5px;
}
@keyframes anvl-preview-ring-pulse {
  0% { outline-offset: 9px; outline-color: color-mix(in srgb, var(--color-accent) 45%, transparent); }
  100% { outline-offset: 3px; outline-color: var(--color-accent); }
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

/* ------------------------------------------------------------------------- *
 * Overlay — one absolutely-positioned div tracking the highlighted element's
 * getBoundingClientRect. A `::after` pseudo is unreliable here (targets may
 * already use ::after, be inline, or clip overflow), so a fixed-position div
 * re-measured on scroll (capture — catches nested scrollers) and resize is
 * used instead. Presentation-only (aria-hidden, pointer-events: none).
 * ------------------------------------------------------------------------- */

let overlayState: { el: HTMLElement; detach: () => void } | null = null

function detachOverlay() {
  overlayState?.detach()
  overlayState = null
}

function attachOverlay(el: HTMLElement) {
  if (overlayState?.el === el) return // Stable across same-target re-reports.
  detachOverlay()
  ensureRingStyles()

  const overlay = document.createElement('div')
  overlay.className = OVERLAY_CLASS
  overlay.setAttribute('aria-hidden', 'true')

  const update = () => {
    const rect = el.getBoundingClientRect()
    overlay.style.left = `${rect.left}px`
    overlay.style.top = `${rect.top}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
  }
  update()
  document.body.appendChild(overlay)
  window.addEventListener('scroll', update, { capture: true, passive: true })
  window.addEventListener('resize', update)

  overlayState = {
    el,
    detach: () => {
      window.removeEventListener('scroll', update, { capture: true })
      window.removeEventListener('resize', update)
      overlay.remove()
    },
  }
}

let hoverEl: HTMLElement | null = null
let flashEl: HTMLElement | null = null
let ringTimer: ReturnType<typeof setTimeout> | null = null

/** The overlay follows whichever highlight is active — hover wins over flash. */
function syncOverlay() {
  const el = hoverEl ?? flashEl
  if (el) attachOverlay(el)
  else detachOverlay()
}

/**
 * Landing scene targets (`the-oath:<scene>`) resolve against the Oath's
 * existing `data-scene` DOM contract instead of new attributes, so the
 * cinematic components stay untouched.
 */
export const OATH_SCENE_TARGET_PATTERN =
  /^the-oath:(hero|manifesto|tenets|products|finale)$/

function findTargetElement(target: PreviewTarget): HTMLElement | null {
  const selector = `[${PREVIEW_TARGET_ATTR}="${CSS.escape(previewTargetValue(target))}"]`
  const direct = document.querySelector<HTMLElement>(selector)
  if (direct) return direct
  const scene = target.id.match(OATH_SCENE_TARGET_PATTERN)?.[1]
  if (scene) return document.querySelector<HTMLElement>(`[data-scene="${scene}"]`)
  return null
}

/**
 * Scroll the target's element into view and flash the highlight (outline +
 * overlay, ~2.4s). Returns whether an element was found (reported back to
 * the admin).
 */
export function highlightPreviewTarget(target: PreviewTarget): boolean {
  const el = findTargetElement(target)
  if (!el) return false

  ensureRingStyles()
  if (flashEl && flashEl !== hoverEl) flashEl.classList.remove(RING_CLASS)
  if (ringTimer) clearTimeout(ringTimer)

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  el.classList.add(RING_CLASS)
  flashEl = el
  syncOverlay()
  ringTimer = setTimeout(() => {
    if (flashEl && flashEl !== hoverEl) flashEl.classList.remove(RING_CLASS)
    flashEl = null
    syncOverlay()
  }, RING_DURATION_MS)
  return true
}

/**
 * Inspection-style hover highlight: outline + overlay stay on while the admin
 * hovers the matching editor field (or, in inspect mode, while the cursor is
 * on the element), clearing on `target: null`. `scroll` (default true) brings
 * the element into view — admin-driven hovers want that; inspect-mode local
 * hovers must NOT scroll (the element is already under the cursor).
 */
export function setPreviewHoverTarget(
  target: PreviewTarget | null,
  options?: { scroll?: boolean },
): boolean {
  if (hoverEl) {
    if (hoverEl !== flashEl) hoverEl.classList.remove(RING_CLASS)
    hoverEl = null
  }
  if (!target) {
    syncOverlay()
    return true
  }

  const el = findTargetElement(target)
  if (!el) {
    syncOverlay()
    return false
  }

  ensureRingStyles()
  if (options?.scroll !== false) {
    el.scrollIntoView({ behavior: 'auto', block: 'center' })
  }
  el.classList.add(RING_CLASS)
  hoverEl = el
  syncOverlay()
  return true
}
