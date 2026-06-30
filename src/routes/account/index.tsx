import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import {
  AccountExperience,
  ACCOUNT_TABS,
  type AccountTab,
} from '@/features/storefront-account/account/AccountExperience'

type AccountSearch = { tab: AccountTab }

export const Route = createFileRoute('/account/')({
  validateSearch: (search: Record<string, unknown>): AccountSearch => ({
    tab: ACCOUNT_TABS.includes(search.tab as AccountTab)
      ? (search.tab as AccountTab)
      : 'personal',
  }),
  head: () =>
    buildSeoMeta({
      title: 'Account | ANVL Athletics',
      description: 'Your ANVL Athletics account.',
      path: '/account',
      noIndex: true,
    }),
  component: AccountPage,
})

function AccountPage() {
  const { tab } = Route.useSearch()
  const navigate = useNavigate()
  return (
    <AccountExperience
      tab={tab}
      onTabChange={(next) => void navigate({ to: '/account', search: { tab: next } })}
    />
  )
}
