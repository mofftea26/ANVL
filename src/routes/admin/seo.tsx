import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/seo')({
  component: lazyRouteComponent(
    () => import('./-adminSeo'),
    'AdminSeoHubPageRoute',
  ),
})
