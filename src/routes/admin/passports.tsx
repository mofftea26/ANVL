import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/passports')({
  component: lazyRouteComponent(() => import('./-adminPassports'), 'AdminPassportsPageRoute'),
})
