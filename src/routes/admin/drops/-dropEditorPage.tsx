import { getRouteApi } from '@tanstack/react-router'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { DropEditorRoute } from '@/features/admin/drops/DropEditorRoute'

const routeApi = getRouteApi('/admin/drops/$dropId')

export function AdminDropEditorPageRoute() {
  const { dropId } = routeApi.useParams()
  return (
    <ProtectedAdminRoute>
      <DropEditorRoute dropId={dropId} />
    </ProtectedAdminRoute>
  )
}
