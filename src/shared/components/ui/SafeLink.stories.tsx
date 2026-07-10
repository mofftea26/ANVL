import type { Meta, StoryObj } from '@storybook/react-vite'
import { SafeLink } from './SafeLink'

const meta: Meta<typeof SafeLink> = {
  title: 'Components/SafeLink',
  component: SafeLink,
  args: {
    className: 'text-sm text-[var(--color-accent)] underline underline-offset-4',
  },
}
export default meta

type Story = StoryObj<typeof SafeLink>

// Note: internal (relative) hrefs render via TanStack Router's <Link>, which
// needs a RouterProvider this preview doesn't have — storied here with an
// external href instead, which renders a plain <a> and needs no provider.
export const External: Story = {
  args: {
    href: 'https://instagram.com/anvl.athletics',
    children: '@anvl.athletics',
  },
}

export const RejectedHref: Story = {
  args: {
    href: 'javascript:alert(1)',
    children: 'Sanitized to plain text',
  },
}
