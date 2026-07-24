import { getRouteApi } from '@tanstack/react-router'

import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { PassportContentTabsEditor } from '@/features/admin/passports/PassportContentTabsEditor'

const route = getRouteApi('/admin/passports_/content/$slug')

export function AdminPassportContentPageRoute() {
  const { slug } = route.useParams()

  return (
    <AdminLayout layout="workspace">
      <PassportContentTabsEditor productSlug={slug} />
    </AdminLayout>
  )
}
