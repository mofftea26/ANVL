import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/story')({
  component: lazyRouteComponent(
    () => import('./-adminStory'),
    'AdminStoryPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
