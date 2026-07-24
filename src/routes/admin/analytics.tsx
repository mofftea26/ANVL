import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

import { AdminEditorLoading } from '@/features/admin/components/AdminEditorLoading'

export const Route = createFileRoute('/admin/analytics')({
  component: lazyRouteComponent(() => import('./-adminAnalytics'), 'AdminAnalyticsPageRoute'),
  pendingComponent: AdminEditorLoading,
})
