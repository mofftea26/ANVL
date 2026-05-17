import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/website-layout')({
  component: lazyRouteComponent(
    () => import('./-websiteLayoutRoute'),
    'WebsiteLayoutPageRoute',
  ),
})
