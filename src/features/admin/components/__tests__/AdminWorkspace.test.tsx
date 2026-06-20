import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'

describe('AdminWorkspace', () => {
  it('renders the primary column without a rail when no aside is given', () => {
    render(
      <AdminWorkspace>
        <p>Primary editor</p>
      </AdminWorkspace>,
    )

    expect(screen.getByText('Primary editor')).toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('renders primary content alongside a labelled contextual rail', () => {
    render(
      <AdminWorkspace aside={<p>Live preview</p>}>
        <p>Primary editor</p>
      </AdminWorkspace>,
    )

    expect(screen.getByText('Primary editor')).toBeInTheDocument()
    const rail = screen.getByRole('complementary', { name: 'Workspace context' })
    expect(rail).toBeInTheDocument()
    expect(rail).toHaveTextContent('Live preview')
  })

  it('applies a custom rail label', () => {
    render(
      <AdminWorkspace asideLabel="Theme preview" aside={<p>Preview</p>}>
        <p>Editor</p>
      </AdminWorkspace>,
    )

    expect(
      screen.getByRole('complementary', { name: 'Theme preview' }),
    ).toBeInTheDocument()
  })
})
