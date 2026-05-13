import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { createDraftDrop } from '@/features/admin/drops/drops.service'

export const Route = createFileRoute('/admin/drops/new')({
  component: NewDropRoute,
})

function NewDropRoute() {
  return (
    <ProtectedAdminRoute>
      <NewDropBootstrap />
    </ProtectedAdminRoute>
  )
}

function NewDropBootstrap() {
  const navigate = useNavigate()

  useEffect(() => {
    const drop = createDraftDrop()
    navigate({
      to: '/admin/drops/$dropId',
      params: { dropId: drop.id },
      replace: true,
    })
  }, [navigate])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-text-muted)]">
      Creating your drop…
    </div>
  )
}
