import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminCard } from '../AdminCard'

describe('AdminCard', () => {
  it('renders as a section landmark with logical h2 heading and description', () => {
    const { container } = render(
      <AdminCard title="Forge tools" description="Shape drops with intent.">
        <p>Badge area</p>
      </AdminCard>,
    )

    expect(container.querySelector('section')).toBeTruthy()
    const heading = screen.getByRole('heading', { name: /forge tools/i })
    expect(heading.tagName.toLowerCase()).toBe('h2')
    expect(screen.getByText(/shape drops with intent/i)).toBeTruthy()
    expect(screen.getByText(/badge area/i)).toBeTruthy()
  })

  it('renders badge text from children when used as a dashboard tile', () => {
    render(
      <AdminCard title="Drops" description="Manage campaigns.">
        <span>CMS workspace</span>
      </AdminCard>,
    )

    expect(screen.getByText(/cms workspace/i)).toBeTruthy()
  })

  it('omits headings when title, description, and actions are absent', () => {
    render(<AdminCard>Body only</AdminCard>)

    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.getByText(/body only/i)).toBeTruthy()
  })
})
