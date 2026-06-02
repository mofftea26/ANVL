/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { CampaignMark } from '@/shared/components/brand/CampaignMark'
import { BRAND_EMBLEM_ASSETS } from '@/features/marketing/default-landing/brandShowcaseAssets'

describe('CampaignMark', () => {
  it('renders inline stacked SVG for known brand paths', () => {
    const { container } = render(
      <CampaignMark src={BRAND_EMBLEM_ASSETS.stacked} onDark />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders oath shape for the-oath-shape asset', () => {
    const { container } = render(<CampaignMark src={BRAND_EMBLEM_ASSETS.oath} onDark />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('falls back to img for unknown emblem URLs', () => {
    const { container } = render(
      <CampaignMark src="https://cdn.example.com/custom-emblem.png" onDark />,
    )
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/custom-emblem.png')
  })

  it('forwards data-act-emblem to the rendered mark', () => {
    const { container } = render(
      <CampaignMark src={BRAND_EMBLEM_ASSETS.mark} data-act-emblem onDark />,
    )
    expect(container.querySelector('[data-act-emblem]')).not.toBeNull()
  })
})
