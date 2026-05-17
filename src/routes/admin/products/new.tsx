import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/products/new')({
  component: lazyRouteComponent(
    () => import('./-newProduct'),
    'AdminNewProductPageRoute',
  ),
})
