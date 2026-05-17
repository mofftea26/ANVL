import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/login')({
  component: lazyRouteComponent(
    () => import('./-adminLogin'),
    'AdminLoginPageRoute',
  ),
})
