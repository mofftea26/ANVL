import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin-preview')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/login', replace: true })
  },
  component: () => null,
})
