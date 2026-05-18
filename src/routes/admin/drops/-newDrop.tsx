import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import {
  createDraftDrop,
  getDropById,
} from '@/features/admin/drops/drops.service'
import { AdminSpinner } from '@/shared/components/ui/AdminSpinner'

export function AdminNewDropPageRoute() {
  return (
    <ProtectedAdminRoute>
      <NewDropBootstrap />
    </ProtectedAdminRoute>
  )
}

function NewDropBootstrap() {
  const navigate = useNavigate()
  const [persistError, setPersistError] = useState<string | null>(null)

  useEffect(() => {
    const drop = createDraftDrop()
    if (!getDropById(drop.id)) {
      setPersistError(
        'The new drop did not appear in storage. Try again or return to the list.',
      )
      return
    }
    navigate({
      to: '/admin/drops/$dropId',
      params: { dropId: drop.id },
      replace: true,
    })
  }, [navigate])

  if (persistError) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center text-sm text-[var(--color-text-muted)]"
        role="alert"
      >
        <p>{persistError}</p>
        <Link
          to="/admin/drops"
          className="text-[var(--color-heading)] underline"
        >
          Back to drops
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-[var(--color-text-muted)]">
      <AdminSpinner label="Creating your drop" />
      <span aria-hidden="true">Creating your drop…</span>
    </div>
  )
}
