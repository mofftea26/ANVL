import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/theme')({
  component: lazyRouteComponent(
    () => import('./-adminTheme'),
    'AdminThemePageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
