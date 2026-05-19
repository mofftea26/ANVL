import { useEffect, type PropsWithChildren } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAdminAuth } from './useAdminAuth'

/**
 * Client-side admin guard only — not production security. Auth state lives in
 * `localStorage`, which isn't available during SSR, so we render a status
 * region while hydration runs and redirect once auth is known.
 */
export function ProtectedAdminRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isHydrated, isRemoteCmsReady } = useAdminAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isHydrated && isRemoteCmsReady && !isAuthenticated) {
      void navigate({ to: '/admin/login', replace: true })
    }
  }, [isAuthenticated, isHydrated, isRemoteCmsReady, navigate])

  if (!isHydrated || !isRemoteCmsReady || !isAuthenticated) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]"
      >
        <p className="anvl-micro text-[var(--color-text-muted)]">
          {isHydrated ? 'Redirecting to admin login…' : 'Loading admin…'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
