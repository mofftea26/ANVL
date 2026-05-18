import {
  type PropsWithChildren,
  type ReactNode,
  useId,
  useRef,
} from 'react'
import { cn } from '@/shared/lib/cn'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'

export type DrawerAriaProps = {
  'aria-labelledby'?: string
  'aria-label'?: string
}

export type DrawerProps = PropsWithChildren<
  {
    open: boolean
    onClose: () => void
    className?: string
    placement?: 'left' | 'right' | 'bottom'
    title?: ReactNode
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
  placement = 'right',
  title,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null)
  const generatedTitleId = useId()

  const isBottom = placement === 'bottom'
  const isLeft = placement === 'left'
  const hasTitle = title != null && title !== ''

  useDialogFocusTrap({ open, panelRef, onClose })

  if (!open) return null

  const labelledByProp =
    ariaLabelledBy && ariaLabelledBy.trim() ? ariaLabelledBy.trim() : undefined
  const titleHeadingId = hasTitle ? generatedTitleId : undefined

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 cursor-pointer bg-black/70"
        onClick={() => onClose()}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'absolute flex min-h-0 flex-col border-[var(--color-line)] bg-[var(--color-surface)] p-6 outline-none',
          isBottom
            ? 'bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border-t'
            : isLeft
              ? 'left-0 top-0 h-[100dvh] max-h-[100dvh] w-[88%] max-w-sm overflow-y-auto border-r border-l-0'
              : 'right-0 top-0 h-full max-h-[100dvh] w-[88%] max-w-sm overflow-y-auto border-l',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={
          labelledByProp || hasTitle ? undefined : ariaLabel?.trim() || 'Panel'
        }
        aria-labelledby={labelledByProp ?? titleHeadingId}
      >
        {hasTitle ? (
          <h2 id={titleHeadingId} className="anvl-heading mb-4 shrink-0 text-2xl">
            {title}
          </h2>
        ) : null}
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            isBottom && 'pb-2',
          )}
        >
          {children}
        </div>
      </aside>
    </div>
  )
}
