/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { AccordionDisclosure } from '@/shared/components/ui/AccordionDisclosure'

describe('AccordionDisclosure (RESP-14)', () => {
  it('renders the title in summary and content in body', () => {
    const { container, getByText } = render(
      <AccordionDisclosure title="Fit & sizing">
        <p>Body copy here.</p>
      </AccordionDisclosure>,
    )
    expect(getByText('Fit & sizing')).toBeTruthy()
    expect(getByText('Body copy here.')).toBeTruthy()
    expect(container.querySelector('summary')).not.toBeNull()
  })

  it('marks the chevron decoration as aria-hidden', () => {
    const { container } = render(
      <AccordionDisclosure title="Care">
        <p>care body</p>
      </AccordionDisclosure>,
    )
    const decorative = container.querySelector('[aria-hidden="true"]')
    expect(decorative).not.toBeNull()
    expect(decorative?.textContent).toContain('▼')
  })

  it('applies focus-ring on the summary so keyboard users see a focus state', () => {
    const { container } = render(
      <AccordionDisclosure title="Care">
        <p>care body</p>
      </AccordionDisclosure>,
    )
    const summary = container.querySelector('summary')
    expect(summary?.className).toContain('focus-ring')
  })
})
