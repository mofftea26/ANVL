import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/account/settings')({
  beforeLoad: () => {
    throw redirect({ to: '/account', search: { tab: 'settings' } })
  },
})
