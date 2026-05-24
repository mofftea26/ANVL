import { useEffect, type PropsWithChildren } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { useAdminAuth } from './useAdminAuth'

/**
 * Client-side admin guard only — not production security. Auth state lives in
 * `localStorage`, which isn't available during SSR, so we render a status
 * region while hydration runs and redirect once auth is known.
 */
export function ProtectedAdminRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isHydrated } = useAdminAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      void navigate({ to: '/admin/login', replace: true })
    }
  }, [isAuthenticated, isHydrated, navigate])

  if (!isHydrated || !isAuthenticated) {
    const message = !isHydrated
      ? 'Loading admin…'
      : 'Redirecting to admin login…'

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4">
        <AdminLoadingState message={message} />
        {!isHydrated ? (
          <p className="mt-4 max-w-sm text-center text-[11px] text-[var(--color-text-muted)]">
            If this does not finish within a minute, reload the page or check your
            network and Supabase project keys in{' '}
            <span className="font-mono text-[10px]">.env</span>.
          </p>
        ) : null}
      </div>
    )
  }

  return <>{children}</>
}
