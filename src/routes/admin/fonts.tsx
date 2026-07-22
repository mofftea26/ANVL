import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/fonts')({
  component: lazyRouteComponent(
    () => import('./-adminFonts'),
    'AdminFontsPageRoute',
  ),
  pendingComponent: AdminEditorLoading,
})
