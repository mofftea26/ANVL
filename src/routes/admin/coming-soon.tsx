import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/coming-soon')({
  component: lazyRouteComponent(
    () => import('./-adminComingSoon'),
    'AdminComingSoonPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
