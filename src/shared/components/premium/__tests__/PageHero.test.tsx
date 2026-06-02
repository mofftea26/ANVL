import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHero } from '@/shared/components/premium/PageHero'

describe('PageHero', () => {
  it('renders title and intro', () => {
    render(
      <PageHero eyebrow="Drop 01" title="The Oath" intro="Forged under pressure." />,
    )
    expect(screen.getByRole('heading', { name: 'The Oath' })).toBeInTheDocument()
    expect(screen.getByText('Forged under pressure.')).toBeInTheDocument()
    expect(screen.getByText('Drop 01')).toBeInTheDocument()
  })
})
