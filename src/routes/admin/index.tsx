import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/')({
  component: lazyRouteComponent(
    () => import('./-adminDashboard'),
    'AdminDashboardPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
