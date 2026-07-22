import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/about')({
  component: lazyRouteComponent(() => import('./-adminAbout'), 'AdminAboutPageRoute'),
  pendingComponent: AdminEditorLoading,
})
