import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/support')({
  component: lazyRouteComponent(() => import('./-adminSupport'), 'AdminSupportPageRoute'),
})
