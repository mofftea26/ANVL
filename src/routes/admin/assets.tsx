import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/assets')({
  component: lazyRouteComponent(
    () => import('./-adminAssets'),
    'AdminAssetsPageRoute',
  ),
})
