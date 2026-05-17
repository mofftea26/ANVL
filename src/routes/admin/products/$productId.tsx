import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/products/$productId')({
  parseParams: (params) =>
    params.productId === 'new' ? false : { productId: params.productId },
  component: lazyRouteComponent(
    () => import('./-productEditorPage'),
    'AdminProductEditorPageRoute',
  ),
})
