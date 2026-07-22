import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/support')({
  component: lazyRouteComponent(() => import('./-adminSupport'), 'AdminSupportPageRoute'),
  pendingComponent: AdminEditorLoading,
})
