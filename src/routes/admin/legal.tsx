import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/legal')({
  component: lazyRouteComponent(() => import('./-adminLegal'), 'AdminLegalPageRoute'),
  pendingComponent: AdminEditorLoading,
})
