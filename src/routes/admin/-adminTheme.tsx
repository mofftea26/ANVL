import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'
import { SiteThemeEditor } from '@/features/admin/site-theme/SiteThemeEditor'

export function AdminThemePageRoute() {
  return (
    <AdminLayout layout="workspace">
      {/* Theme edits repaint the whole page — hover anywhere rings the page. */}
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <SiteThemeEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
