import { createFileRoute } from '@tanstack/react-router'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { DropEditorRoute } from '@/features/admin/drops/DropEditorRoute'

export const Route = createFileRoute('/admin/drops/$dropId')({
  parseParams: (params) =>
    params.dropId === 'new' ? false : { dropId: params.dropId },
  component: DropEditorPage,
})

function DropEditorPage() {
  const { dropId } = Route.useParams()
  return (
    <ProtectedAdminRoute>
      <DropEditorRoute dropId={dropId} />
    </ProtectedAdminRoute>
  )
}
