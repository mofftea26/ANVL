import {
  type PropsWithChildren,
  useLayoutEffect,
  useRef,
} from 'react'
import { cn } from '@/shared/lib/cn'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type DrawerAriaProps = {
  'aria-labelledby'?: string
  'aria-label'?: string
}

export type DrawerProps = PropsWithChildren<
  {
    open: boolean
    onClose: () => void
    className?: string
  } & DrawerAriaProps
>

/**
 * Accessible slide-in panel: same focus and keyboard behavior as `Modal`.
 */
export function Drawer({
  open,
  onClose,
  children,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null)
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
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 cursor-pointer bg-black/70"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto border-l border-[var(--color-line)] bg-[var(--color-surface)] p-6 outline-none',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={
          ariaLabelledBy && ariaLabelledBy.trim()
            ? undefined
            : ariaLabel?.trim() || 'Panel'
        }
        aria-labelledby={
          ariaLabelledBy && ariaLabelledBy.trim() ? ariaLabelledBy : undefined
        }
      >
        {children}
      </aside>
    </div>
  )
}
