import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/drops/')({
  component: lazyRouteComponent(
    () => import('./-dropsIndex'),
    'AdminDropsIndexPageRoute',
  ),
})
