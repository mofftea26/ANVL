import { BannerEditor } from '@/features/admin/banner/BannerEditor'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPreviewHoverScope } from '@/features/admin/preview/AdminPreviewHoverScope'

export function AdminBannerPageRoute() {
  return (
    <AdminLayout
      title="Banner"
      description="Storefront announcement banner — message, link, colors, and an optional schedule for the strip above the topbar."
      layout="workspace"
    >
      <AdminPreviewHoverScope target={{ kind: 'content-field', id: 'banner:rail' }}>
        <BannerEditor />
      </AdminPreviewHoverScope>
    </AdminLayout>
  )
}
