import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'

import { AdminShellLayout } from '@/features/admin/components/AdminShellLayout'

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    isRemoteCmsReady: true,
    remoteHydrateError: null,
    logout: vi.fn(),
    session: {
      kind: 'supabase' as const,
      email: 'editor@anvl.test',
      userId: 'u1',
      displayName: 'Editor',
      loggedInAt: '2026-01-01T00:00:00.000Z',
    },
  }),
}))

vi.mock('@/features/admin/components/AdminSyncIndicator', () => ({
  AdminSyncIndicator: () => null,
}))

vi.mock('@/features/admin/preview/AdminPreviewPanel', () => ({
  AdminPreviewPanel: () => <div data-testid="preview-panel">Preview</div>,
}))

function buildRouter(initialPath: string) {
  const rootRoute = createRootRoute({ component: AdminShellLayout })
  const themeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/theme',
    component: () => <div>Theme editor page</div>,
  })
  const fontsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/fonts',
    component: () => <div>Fonts editor page</div>,
  })
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/login',
    component: () => <div>Login page</div>,
  })
  return createRouter({
    routeTree: rootRoute.addChildren([themeRoute, fontsRoute, loginRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('AdminShellLayout (persistent shell)', () => {
  it('keeps the same sidebar DOM node across child navigation', async () => {
    const router = buildRouter('/admin/theme')
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('Theme editor page')).toBeInTheDocument()
    const sidebarBefore = screen.getByRole('navigation', { name: 'Admin' })
    const headingBefore = screen.getByRole('heading', { name: 'Theme & Colors' })
    expect(headingBefore).toBeInTheDocument()

    await router.navigate({ to: '/admin/fonts' })

    expect(await screen.findByText('Fonts editor page')).toBeInTheDocument()
    expect(screen.queryByText('Theme editor page')).toBeNull()
    // The persistent topbar re-resolves the title from the nav registry.
    expect(screen.getByRole('heading', { name: 'Fonts' })).toBeInTheDocument()

    const sidebarAfter = screen.getByRole('navigation', { name: 'Admin' })
    // Identity, not equality — the shell must not have remounted.
    expect(Object.is(sidebarBefore, sidebarAfter)).toBe(true)
  })

  it('keeps the live-preview panel open across navigation', async () => {
    const user = userEvent.setup()
    const router = buildRouter('/admin/theme')
    render(<RouterProvider router={router} />)

    await screen.findByText('Theme editor page')
    await user.click(screen.getByRole('button', { name: 'Open live preview' }))
    expect(await screen.findByTestId('preview-panel')).toBeInTheDocument()

    await router.navigate({ to: '/admin/fonts' })
    await screen.findByText('Fonts editor page')

    expect(screen.getByTestId('preview-panel')).toBeInTheDocument()
  })

  it('skips the admin chrome entirely on /admin/login', async () => {
    const router = buildRouter('/admin/login')
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('Login page')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Admin' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open live preview' })).toBeNull()
  })
})
