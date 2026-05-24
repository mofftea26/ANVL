/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CampaignCardsSection } from '@/features/marketing/home/CampaignCardsSection'
import { LookbookStripSection } from '@/features/marketing/home/LookbookStripSection'

describe('CampaignCardsSection', () => {
  it('renders nothing when campaigns array is empty', () => {
    const { container } = render(<CampaignCardsSection campaigns={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders campaign cards when data is present', () => {
    render(
      <CampaignCardsSection
        campaigns={[
          { id: 'c1', title: 'Drop 01', description: 'Limited launch' },
        ]}
      />,
    )
    expect(screen.getByRole('region', { name: 'Campaigns' })).toBeInTheDocument()
    expect(screen.getByText('Drop 01')).toBeInTheDocument()
    expect(screen.getByText('Limited launch')).toBeInTheDocument()
  })
})

describe('LookbookStripSection', () => {
  it('skips tiles without src', () => {
    render(
      <LookbookStripSection
        items={[
          { id: 'l1', alt: 'Hidden', src: '   ' },
          { id: 'l2', alt: 'Visible', src: '/brand/lookbook-1.webp' },
        ]}
      />,
    )
    expect(screen.getByAltText('Visible')).toBeInTheDocument()
    expect(screen.queryByAltText('Hidden')).toBeNull()
  })
})
