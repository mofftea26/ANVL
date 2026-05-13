import { useEffect, type PropsWithChildren } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAdminAuth } from './useAdminAuth'

/**
 * Client-side admin guard. Auth state lives in `localStorage`, which
 * isn't available during SSR — we therefore render a small skeleton
 * while hydration is in flight and only redirect once the auth state
 * is known.
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="anvl-micro text-[var(--color-text-muted)]">
          {isHydrated ? 'Redirecting to admin login…' : 'Loading admin…'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
