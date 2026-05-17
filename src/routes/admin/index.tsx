import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: lazyRouteComponent(
    () => import('./-adminDashboard'),
    'AdminDashboardPageRoute',
  ),
})
