import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { SiteFontEditor } from '@/features/admin/site-font/SiteFontEditor'

export function AdminFontsPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout title="Fonts" description="Heading, body, and display typefaces.">
        <SiteFontEditor />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
