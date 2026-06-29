import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/shop')({
  component: lazyRouteComponent(() => import('./-adminShop'), 'AdminShopPageRoute'),
})
