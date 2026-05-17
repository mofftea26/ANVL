import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/drops/new')({
  component: lazyRouteComponent(
    () => import('./-newDrop'),
    'AdminNewDropPageRoute',
  ),
})
