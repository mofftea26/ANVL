import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/products')({
  component: lazyRouteComponent(() => import('./-adminProducts'), 'AdminProductsPageRoute'),
  pendingComponent: AdminEditorLoading,
})
