import { createFileRoute, redirect } from '@tanstack/react-router'

// Order detail now lives inline in the Orders tab of the unified account page.
export const Route = createFileRoute('/account/orders/$orderId')({
  beforeLoad: () => {
    throw redirect({ to: '/account', search: { tab: 'orders' } })
  },
})
