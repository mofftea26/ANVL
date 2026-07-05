import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { SiteFontEditor } from '@/features/admin/site-font/SiteFontEditor'

export function AdminFontsPageRoute() {
  return (
    <AdminLayout title="Fonts" description="Heading, body, and display typefaces." layout="workspace">
      <SiteFontEditor />
    </AdminLayout>
  )
}
