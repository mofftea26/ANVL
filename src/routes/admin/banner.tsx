import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/banner')({
  component: lazyRouteComponent(() => import('./-adminBanner'), 'AdminBannerPageRoute'),
})
