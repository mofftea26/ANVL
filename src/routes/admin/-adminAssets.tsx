import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { SiteAssetsEditor } from '@/features/admin/site-assets/SiteAssetsEditor'

export function AdminAssetsPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Assets"
        description="Media library and slot assignments for general and per-drop use."
        layout="workspace"
      >
        <SiteAssetsEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
