import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'
import { SiteFontEditor } from '@/features/admin/site-font/SiteFontEditor'

export function AdminFontsPageRoute() {
  return (
    <AdminLayout title="Fonts" description="Heading, body, and display typefaces." layout="workspace">
      {/* Font edits restyle the whole page — hover anywhere rings the page. */}
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <SiteFontEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
