import { createFileRoute, redirect } from '@tanstack/react-router'

// Account is now a single bento experience; this legacy path redirects to the tab.
export const Route = createFileRoute('/account/personal')({
  beforeLoad: () => {
    throw redirect({ to: '/account', search: { tab: 'personal' } })
  },
})
