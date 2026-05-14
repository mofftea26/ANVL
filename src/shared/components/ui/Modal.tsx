import {
  type PropsWithChildren,
  useLayoutEffect,
  useRef,
} from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type ModalAriaProps = {
  'aria-labelledby'?: string
  'aria-label'?: string
}

export type ModalProps = PropsWithChildren<
  { open: boolean; onClose: () => void } & ModalAriaProps
>

/**
 * Accessible modal: focus moves to the first focusable control on open,
 * Tab cycles within the dialog, Escape closes, and focus restores on close.
 */
export function Modal({
  open,
  onClose,
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (!panel) return

    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled'),
      )

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
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="absolute inset-0 cursor-pointer bg-black/70"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={
          ariaLabelledBy && ariaLabelledBy.trim()
            ? undefined
            : ariaLabel?.trim() || 'Dialog'
        }
        aria-labelledby={
          ariaLabelledBy && ariaLabelledBy.trim() ? ariaLabelledBy : undefined
        }
      >
        {children}
      </div>
    </div>
  )
}
