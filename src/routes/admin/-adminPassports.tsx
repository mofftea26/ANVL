import { getRouteApi } from '@tanstack/react-router'

import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminPassportsEditor } from '@/features/admin/passports/AdminPassportsEditor'

const route = getRouteApi('/admin/passports')

export function AdminPassportsPageRoute() {
  const { tab, product } = route.useSearch()

  return (
    <AdminLayout
      title="Passports"
      description="Generate and track per-unit QR product passports."
      layout="workspace"
    >
      <AdminPassportsEditor initialTab={tab} initialProductSlug={product} />
    </AdminLayout>
  )
}
