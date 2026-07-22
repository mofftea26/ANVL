import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/settings')({
  component: lazyRouteComponent(
    () => import('./-adminSettings'),
    'AdminSettingsPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
