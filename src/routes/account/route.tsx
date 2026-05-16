import { createFileRoute } from '@tanstack/react-router'
import { AccountShellLayout } from '@/features/storefront-account'

export const Route = createFileRoute('/account')({
  component: AccountRouteShell,
})

function AccountRouteShell() {
  return <AccountShellLayout />
}
