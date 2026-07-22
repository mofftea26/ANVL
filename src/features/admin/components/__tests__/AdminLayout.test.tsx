import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminLayout } from '@/features/admin/components/AdminLayout'

describe('AdminLayout', () => {
  it('renders children inside the content column (no chrome of its own)', () => {
    render(
      <AdminLayout layout="workspace">
        <p>Editor body</p>
      </AdminLayout>,
    )

    expect(screen.getByText('Editor body')).toBeInTheDocument()
    // The chrome (topbar, sidebar, drawer) lives in the persistent shell now —
    // the per-page wrapper must not render any of it.
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders default layout children as well', () => {
    render(
      <AdminLayout>
        <p>Narrow body</p>
      </AdminLayout>,
    )
    expect(screen.getByText('Narrow body')).toBeInTheDocument()
  })
})
