import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/gamification')({
  component: lazyRouteComponent(
    () => import('./-adminGamification'),
    'AdminGamificationPageRoute',
  ),
})
