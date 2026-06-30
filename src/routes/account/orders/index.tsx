import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/account/orders/')({
  beforeLoad: () => {
    throw redirect({ to: '/account', search: { tab: 'orders' } })
  },
})
