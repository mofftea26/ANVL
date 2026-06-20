import { Loader2 } from 'lucide-react'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { cn } from '@/shared/lib/cn'

/** Non-blocking sync pill — fixed corner, never shifts page layout. */
export function AdminSyncIndicator() {
  const { isRemoteSyncing, remoteHydrateError } = useAdminAuth()

  if (!isRemoteSyncing && !remoteHydrateError) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-4 left-4 z-50 flex max-w-[min(18rem,calc(100vw-2rem))] items-center gap-2',
        'rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-lg backdrop-blur-md',
        remoteHydrateError
          ? 'border-[color-mix(in_oklab,var(--color-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_22%,var(--color-surface))] text-[color:var(--color-danger)]'
          : 'border-[var(--color-line)]/80 bg-[var(--color-surface)]/92 text-[var(--color-text-muted)]',
      )}
      role={remoteHydrateError ? 'alert' : 'status'}
      aria-live="polite"
    >
      {isRemoteSyncing ? (
        <Loader2 size={12} className="shrink-0 animate-spin" aria-hidden />
      ) : null}
      <span className="truncate">
        {remoteHydrateError ?? 'Syncing with Supabase…'}
      </span>
    </div>
  )
}
