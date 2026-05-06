import type { PropsWithChildren } from 'react'

export function Modal({
  open,
  onClose,
  children,
}: PropsWithChildren<{ open: boolean; onClose: () => void }>) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
      <div
        className="relative w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}
