import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/content')({
  component: lazyRouteComponent(
    () => import('./-adminContent'),
    'AdminContentPageRoute',
  ),
})
