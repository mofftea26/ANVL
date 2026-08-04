import { getRouteApi } from '@tanstack/react-router'

import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminTechpacksPage } from '@/features/admin/techpacks/AdminTechpacksPage'

const route = getRouteApi('/admin/techpacks')

export function AdminTechpacksPageRoute() {
  const { techpack } = route.useSearch()

  return (
    <AdminLayout layout="workspace">
      <AdminTechpacksPage initialTechpackId={techpack} />
    </AdminLayout>
  )
}
