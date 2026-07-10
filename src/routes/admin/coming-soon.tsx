import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/coming-soon')({
  component: lazyRouteComponent(
    () => import('./-adminComingSoon'),
    'AdminComingSoonPageRoute',
  ),
})
