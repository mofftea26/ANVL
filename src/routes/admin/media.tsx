import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/media')({
  component: lazyRouteComponent(
    () => import('./-adminMedia'),
    'AdminMediaPageRoute',
  ),
})
