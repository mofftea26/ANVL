/**
 * Editor-side anchor highlighting for the preview inspector: while the user
 * inspects the storefront iframe, the matching editor control (identified by
 * its `previewFieldAnchorId` DOM id) is rung in the admin. Mirror of the
 * storefront's `previewHighlight`, but admin-flavored: hover mirror = ring
 * only (no scroll, no focus); locate flash = scroll + ~2s ring + focus the
 * first form control inside the anchor.
 */

const RING_CLASS = 'anvl-admin-anchor-ring'
const STYLE_ID = 'anvl-admin-anchor-ring-style'
const FLASH_DURATION_MS = 2000

/** Injected once — Studio accent ring; reduced motion: no pulse animation. */
const RING_CSS = `
.${RING_CLASS} {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 10px;
  animation: anvl-admin-anchor-pulse 0.7s ease-out 2;
}
@keyframes anvl-admin-anchor-pulse {
  0% { outline-offset: 8px; outline-color: color-mix(in srgb, var(--color-accent) 45%, transparent); }
  100% { outline-offset: 3px; outline-color: var(--color-accent); }
}
@media (prefers-reduced-motion: reduce) {
  .${RING_CLASS} { animation: none; }
}
`

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = RING_CSS
  document.head.appendChild(style)
}

let hoverAnchor: HTMLElement | null = null
let flashAnchor: HTMLElement | null = null
let flashTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Persistent hover mirror (inspect-hover): ring the anchor, clear on null.
 * No scrolling, no focus moves — just the ring.
 */
export function setEditorAnchorRing(anchorId: string | null): void {
  const el = anchorId ? document.getElementById(anchorId) : null
  if (hoverAnchor && hoverAnchor !== el && hoverAnchor !== flashAnchor) {
    hoverAnchor.classList.remove(RING_CLASS)
  }
  hoverAnchor = el
  if (el) {
    ensureStyles()
    el.classList.add(RING_CLASS)
  }
}

/**
 * Locate flash (inspect-click, same page): scroll the anchor into view, ring
 * it for ~2s, and move focus to the first focusable control inside it.
 * Returns whether the anchor exists.
 */
export function flashEditorAnchor(anchorId: string): boolean {
  const el = document.getElementById(anchorId)
  if (!el) return false

  ensureStyles()
  if (flashTimer) clearTimeout(flashTimer)
  if (flashAnchor && flashAnchor !== el && flashAnchor !== hoverAnchor) {
    flashAnchor.classList.remove(RING_CLASS)
  }

  el.scrollIntoView({ block: 'center' })
  el.classList.add(RING_CLASS)
  flashAnchor = el
  el.querySelector<HTMLElement>(
    'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])',
  )?.focus({ preventScroll: true })

  flashTimer = setTimeout(() => {
    if (flashAnchor && flashAnchor !== hoverAnchor) {
      flashAnchor.classList.remove(RING_CLASS)
    }
    flashAnchor = null
  }, FLASH_DURATION_MS)
  return true
}

/** Drop every editor-side highlight (mode off, panel unmount). */
export function clearEditorAnchorHighlights(): void {
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = null
  hoverAnchor?.classList.remove(RING_CLASS)
  flashAnchor?.classList.remove(RING_CLASS)
  hoverAnchor = null
  flashAnchor = null
}

/**
 * rAF-poll for an anchor to appear after a route navigation (lazy admin
 * routes mount asynchronously). Resolves null after `timeoutMs`.
 */
export function waitForEditorAnchor(
  anchorId: string,
  timeoutMs = 3000,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs
    const check = () => {
      const el = document.getElementById(anchorId)
      if (el) {
        resolve(el)
        return
      }
      if (Date.now() > deadline) {
        resolve(null)
        return
      }
      requestAnimationFrame(check)
    }
    check()
  })
}
