import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/account/addresses')({
  beforeLoad: () => {
    throw redirect({ to: '/account', search: { tab: 'addresses' } })
  },
})
