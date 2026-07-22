import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/category/$categoryKey')({
  component: lazyRouteComponent(
    () => import('./-adminCategory'),
    'AdminCategoryPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
