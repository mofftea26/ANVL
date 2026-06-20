import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { SiteThemeEditor } from '@/features/admin/site-theme/SiteThemeEditor'

export function AdminThemePageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Theme & Colors"
        description="Site-wide palette and theme mode."
        layout="workspace"
      >
        <SiteThemeEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
