import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/gamification')({
  component: lazyRouteComponent(
    () => import('./-adminGamification'),
    'AdminGamificationPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
