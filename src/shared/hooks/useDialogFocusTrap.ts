import { useLayoutEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function listFocusables(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled'),
  )
}

/**
 * Focus trap for `role="dialog"` panels: moves focus to the first control on
 * open, cycles Tab / Shift+Tab inside the panel, closes on Escape, restores
 * focus on cleanup. Safe for SSR (effect runs only when `open` is true).
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

    const focusables = () => listFocusables(panel)
    const first = focusables()[0]
    queueMicrotask(() => first?.focus())

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
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
      previouslyFocused?.focus?.()
    }
  }, [open, panelRef])
}
