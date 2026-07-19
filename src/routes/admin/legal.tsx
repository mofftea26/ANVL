import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/legal')({
  component: lazyRouteComponent(() => import('./-adminLegal'), 'AdminLegalPageRoute'),
})
