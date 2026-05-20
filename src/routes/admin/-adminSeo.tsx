import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { SiteSeoEditor } from '@/features/admin/site-seo/SiteSeoEditor'

export function AdminSeoHubPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout title="SEO">
        <SiteSeoEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
