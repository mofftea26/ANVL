/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminTopbar } from '../AdminTopbar'

const logout = vi.fn()

/** Pathname the mocked router reports — set per test before render. */
const routerState = { pathname: '/admin' }

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    session: {
      kind: 'supabase' as const,
      email: 'george@gmail.com',
      userId: 'u1',
      displayName: 'George M',
      loggedInAt: '2026-01-01T00:00:00.000Z',
    },
    logout,
  }),
}))

vi.mock('@/features/admin/components/AdminPageActionsContext', () => ({
  useAdminPageActionsSlot: () => null,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children?: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: routerState.pathname } }),
}))

describe('AdminTopbar', () => {
  beforeEach(() => {
    routerState.pathname = '/admin'
  })

  it('derives the dashboard title + description from the nav registry', () => {
    render(<AdminTopbar onOpenMenu={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    expect(screen.getByText('Every surface one strike away.')).toBeTruthy()
    // No breadcrumb trail on the dashboard itself.
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
  })

  it('derives an editor page title + breadcrumbs from the pathname', () => {
    routerState.pathname = '/admin/theme'
    render(<AdminTopbar onOpenMenu={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Theme & Colors' })).toBeTruthy()

    const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumbs).getByRole('link', { name: 'CMS' })).toBeTruthy()
    // The category crumb links to its landing page (Design has 2 editors).
    const designCrumb = within(breadcrumbs).getByRole('link', { name: 'Design' })
    expect(designCrumb.getAttribute('href')).toBe('/admin/category/design')
    // The current page is always present and marked for assistive tech.
    const current = within(breadcrumbs).getByText('Theme & Colors')
    expect(current.getAttribute('aria-current')).toBe('page')
  })

  it('resolves category landing pages through the category groups', () => {
    routerState.pathname = '/admin/category/content'
    render(<AdminTopbar onOpenMenu={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Content' })).toBeTruthy()
    const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumbs).getByText('Content').getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('shows session chip with email tooltip, not inline display name row', () => {
    render(<AdminTopbar onOpenMenu={() => {}} />)
    expect(screen.queryByText('George M')).toBeNull()
    expect(screen.getByLabelText(/Account menu for george@gmail.com/i)).toBeTruthy()
  })

  it('calls onOpenMenu when the nav burger is activated', async () => {
    const user = userEvent.setup()
    const onOpenMenu = vi.fn()
    render(<AdminTopbar onOpenMenu={onOpenMenu} />)

    const menuButton = screen.getByRole('button', { name: 'Open admin navigation' })
    expect(menuButton).toBeVisible()

    await user.click(menuButton)
    expect(onOpenMenu).toHaveBeenCalledTimes(1)
  })

  it('opens account menu with settings link and no storefront entry', async () => {
    const user = userEvent.setup()
    render(<AdminTopbar onOpenMenu={() => {}} />)
    await user.click(screen.getByLabelText(/Account menu/i))
    expect(screen.getByRole('link', { name: 'Settings' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /view storefront/i })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy()
  })
})
