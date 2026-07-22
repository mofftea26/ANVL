import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'
import { AdminPdpContentEditor } from '@/features/admin/products-content/AdminPdpContentEditor'

export function AdminProductsPageRoute() {
  return (
    <AdminLayout layout="workspace">
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'site:page' }}>
        <AdminPdpContentEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
