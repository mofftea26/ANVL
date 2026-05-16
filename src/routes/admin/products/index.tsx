import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/products/')({
  component: lazyRouteComponent(
    () => import('./-adminProductsIndex'),
    'AdminProductsIndexRoute',
  ),
})
