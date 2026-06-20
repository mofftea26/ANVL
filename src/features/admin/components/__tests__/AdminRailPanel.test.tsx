import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'

describe('AdminRailPanel', () => {
  it('renders the title as a heading with its children', () => {
    render(
      <AdminRailPanel title="Live preview">
        <p>Preview body</p>
      </AdminRailPanel>,
    )

    expect(
      screen.getByRole('heading', { name: 'Live preview' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Preview body')).toBeInTheDocument()
  })

  it('renders an optional description and trailing actions', () => {
    render(
      <AdminRailPanel
        title="Accessibility"
        description="WCAG contrast checks"
        actions={<button type="button">Toggle</button>}
      >
        <p>Rows</p>
      </AdminRailPanel>,
    )

    expect(screen.getByText('WCAG contrast checks')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument()
  })
})
