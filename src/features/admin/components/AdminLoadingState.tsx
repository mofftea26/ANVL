import { AdminSpinner } from '@/features/admin/components/AdminSpinner'
import { cn } from '@/shared/lib/cn'

export type AdminLoadingStateProps = {
  message?: string
  className?: string
}

export function AdminLoadingState({
  message = 'Loading…',
  className,
}: AdminLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8 text-center',
        className,
      )}
    >
      <AdminSpinner label={message} />
      <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
    </div>
  )
}
