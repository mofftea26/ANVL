import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { SiteThemeEditor } from '@/features/admin/site-theme/SiteThemeEditor'

export function AdminThemePageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout title="Brand fallbacks">
        <SiteThemeEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
