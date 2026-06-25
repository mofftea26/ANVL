import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExperienceProvider } from '../ExperienceProvider'
import { useExperienceVariant } from '../useExperienceVariant'

function Classic() {
  return <div>classic-card</div>
}
function TechForge() {
  return <div>techforge-card</div>
}

function Probe() {
  const Card = useExperienceVariant('productCard', {
    classic: Classic,
    techForge: TechForge,
  })
  return <Card />
}

describe('experience variant resolution', () => {
  it('renders the techForge variant under the Theoath Modern experience', () => {
    render(
      <ExperienceProvider activeLandingPageKey="theoath-modern">
        <Probe />
      </ExperienceProvider>,
    )
    expect(screen.getByText('techforge-card')).toBeInTheDocument()
  })

  it('renders the classic variant under the Oath experience (no regression)', () => {
    render(
      <ExperienceProvider activeLandingPageKey="the-oath">
        <Probe />
      </ExperienceProvider>,
    )
    expect(screen.getByText('classic-card')).toBeInTheDocument()
  })

  it('falls back to the classic variant for unknown/legacy keys', () => {
    render(
      <ExperienceProvider activeLandingPageKey="legacy-drop">
        <Probe />
      </ExperienceProvider>,
    )
    expect(screen.getByText('classic-card')).toBeInTheDocument()
  })

  it('scopes data-experience to a storefront wrapper (admin is never re-skinned)', () => {
    const { container } = render(
      <ExperienceProvider activeLandingPageKey="theoath-modern">
        <span>child</span>
      </ExperienceProvider>,
    )
    const wrapper = container.querySelector('[data-experience="theoath-modern"]')
    expect(wrapper).not.toBeNull()
    expect(wrapper).toContainElement(screen.getByText('child'))
  })
})
