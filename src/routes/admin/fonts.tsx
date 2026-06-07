import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/fonts')({
  component: lazyRouteComponent(
    () => import('./-adminFonts'),
    'AdminFontsPageRoute',
  ),
})
