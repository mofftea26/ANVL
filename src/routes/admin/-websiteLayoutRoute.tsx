import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { SiteLayoutEditor } from '@/features/admin/site-layout/SiteLayoutEditor'

export function WebsiteLayoutPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout title="Website layout">
        <SiteLayoutEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
