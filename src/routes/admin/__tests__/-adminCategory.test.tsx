import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { adminNavCategories } from '@/features/admin/components/adminNav'

import { AdminCategoryPageRoute } from '../-adminCategory'

const params = { categoryKey: 'content' }

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
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useParams: () => params,
}))

describe('AdminCategoryPageRoute', () => {
  beforeEach(() => {
    params.categoryKey = 'content'
  })

  it('renders one tile per editor in the category, derived from the nav registry', () => {
    render(<AdminCategoryPageRoute />)

    const group = adminNavCategories().find((g) => g.category === 'Content')!
    expect(group.items.length).toBeGreaterThan(1)

    for (const item of group.items) {
      const link = screen.getByRole('link', { name: new RegExp(item.label, 'i') })
      expect(link.getAttribute('href')).toBe(item.href)
    }
    // Editors from other categories stay off this landing page.
    expect(screen.queryByRole('link', { name: /Theme & Colors/i })).toBeNull()
  })

  it('redirects unknown slugs back to the dashboard', () => {
    params.categoryKey = 'not-a-category'
    render(<AdminCategoryPageRoute />)

    expect(screen.getByTestId('navigate').getAttribute('data-to')).toBe('/admin')
    expect(screen.queryByRole('link')).toBeNull()
  })
})
