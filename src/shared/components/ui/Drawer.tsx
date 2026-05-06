import type { PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export function Drawer({
  open,
  onClose,
  children,
  className,
}: PropsWithChildren<{
  open: boolean
  onClose: () => void
  className?: string
}>) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close drawer backdrop"
      />
      <aside
        className={cn(
          'absolute right-0 top-0 h-full w-[88%] max-w-sm border-l border-[var(--color-line)] bg-[var(--color-surface)] p-6',
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </aside>
    </div>
  )
}
