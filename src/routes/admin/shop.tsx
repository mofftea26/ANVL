import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/shop')({
  component: lazyRouteComponent(() => import('./-adminShop'), 'AdminShopPageRoute'),
  pendingComponent: AdminEditorLoading,
})
