import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/story')({
  component: lazyRouteComponent(
    () => import('./-adminStory'),
    'AdminStoryPageRoute',
  ),
})
