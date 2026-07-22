import { getRouteApi } from '@tanstack/react-router'

import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { SiteAssetsEditor } from '@/features/admin/site-assets/SiteAssetsEditor'

const route = getRouteApi('/admin/assets')

export function AdminAssetsPageRoute() {
  const { page, slot, q } = route.useSearch()

  return (
    <AdminLayout layout="workspace">
      <SiteAssetsEditor initialScope={page} focusSlotKey={slot} initialSearch={q} />
    </AdminLayout>
  )
}
