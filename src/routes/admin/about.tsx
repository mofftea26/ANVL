import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/about')({
  component: lazyRouteComponent(() => import('./-adminAbout'), 'AdminAboutPageRoute'),
})
