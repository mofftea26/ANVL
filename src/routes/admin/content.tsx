import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/content')({
  component: lazyRouteComponent(
    () => import('./-adminContent'),
    'AdminContentPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
