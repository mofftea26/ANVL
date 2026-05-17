import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/theme')({
  component: lazyRouteComponent(
    () => import('./-adminTheme'),
    'AdminThemePageRoute',
  ),
})
