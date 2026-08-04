import { useLayoutEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function listFocusables(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled'),
  )
}

/**
 * Every currently-open trap panel, in registration order.
 *
 * Escape must close ONE dialog — the innermost. Each trap attaches its listener
 * to `document`, so before this every open dialog received the same Escape and
 * all of them called `onClose`: opening a picker from inside a wizard and
 * pressing Escape collapsed the picker AND the wizard behind it, losing the
 * operator's place. `e.stopPropagation()` could never have fixed that — sibling
 * listeners on the SAME node still run.
 */
const openDialogPanels: HTMLElement[] = []

/**
 * Which open dialog owns this Escape?
 *
 * Registration order alone is NOT enough, and getting that wrong is easy:
 * `useLayoutEffect` runs child-first, so a DOM-nested inner dialog registers
 * BEFORE its parent and "last registered" resolves to the outer one — exactly
 * backwards. So containment decides when one panel encloses another, and
 * registration order only breaks ties between panels that do not nest (two
 * portaled siblings, where the later-opened one is genuinely on top).
 */
function innermostOpenDialog(): HTMLElement | undefined {
  const enclosing = openDialogPanels.filter((panel) =>
    openDialogPanels.some((other) => other !== panel && panel.contains(other)),
  )
  const candidates = openDialogPanels.filter((panel) => !enclosing.includes(panel))
  return candidates[candidates.length - 1]
}

/**
 * Focus trap for `role="dialog"` panels: moves focus to the first control on
 * open, cycles Tab / Shift+Tab inside the panel, closes on Escape (topmost
 * dialog only), restores focus on cleanup. Safe for SSR (effect runs only when
 * `open` is true).
 */
export function useDialogFocusTrap(opts: {
  open: boolean
  panelRef: RefObject<HTMLElement | null>
  onClose: () => void
}): void {
  const { open, panelRef, onClose } = opts
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (!panel) return

    openDialogPanels.push(panel)

    const focusables = () => listFocusables(panel)
    const first = focusables()[0]
    queueMicrotask(() => first?.focus())

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Only the innermost open dialog reacts, so one Escape closes one
        // layer instead of the whole stack.
        if (innermostOpenDialog() !== panel) return
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = focusables()
      if (nodes.length === 0) return
      const firstNode = nodes[0]!
      const lastNode = nodes[nodes.length - 1]!
      if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault()
        firstNode.focus()
      } else if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault()
        lastNode.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // Splice by identity, not pop: dialogs can unmount out of order (a parent
      // closing while a child is still open), and popping blindly would strand
      // a dead entry and swallow every later Escape.
      const at = openDialogPanels.lastIndexOf(panel)
      if (at !== -1) openDialogPanels.splice(at, 1)
      previouslyFocused?.focus?.()
    }
  }, [open, panelRef])
}
