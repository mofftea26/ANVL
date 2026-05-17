import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/drops/$dropId')({
  parseParams: (params) =>
    params.dropId === 'new' ? false : { dropId: params.dropId },
  component: lazyRouteComponent(
    () => import('./-dropEditorPage'),
    'AdminDropEditorPageRoute',
  ),
})
