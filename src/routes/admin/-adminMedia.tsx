import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { MediaLibraryPage } from '@/features/admin/media/MediaLibraryPage'

export function AdminMediaPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout title="Media">
        <MediaLibraryPage />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
