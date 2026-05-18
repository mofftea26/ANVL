import { cn } from '@/shared/lib/cn'

export type AdminSpinnerProps = {
  /** Shown to assistive tech (parent has role="status"). */
  label?: string
  className?: string
}

/**
 * Lightweight admin/CMS spinner — pure CSS, respects `prefers-reduced-motion`.
 */
export function AdminSpinner({
  label = 'Loading',
  className,
}: AdminSpinnerProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn('inline-flex flex-col items-center justify-center gap-2', className)}
    >
      <span
        className={cn(
          'inline-block size-9 shrink-0 rounded-full border-2 border-[var(--color-line)]',
          'border-t-[var(--color-accent)] animate-spin',
          'motion-reduce:animate-none motion-reduce:border-[var(--color-accent)] motion-reduce:opacity-80',
        )}
        aria-hidden
      />
    </div>
  )
}
