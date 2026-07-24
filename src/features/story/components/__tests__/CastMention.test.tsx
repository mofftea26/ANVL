/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CastMention, CastText } from '@/features/story/components/CastMention'
import {
  storyCastMemberSchema,
  type StoryCastMember,
} from '@/features/story/schemas/story.schema'

// SafeLink funnels internal hrefs through TanStack <Link>, which needs a
// router. Swap it for a plain anchor so the mention wiring can be tested in
// isolation (the href gate itself lives in CastMention, not SafeLink).
vi.mock('@/shared/components/ui/SafeLink', () => ({
  SafeLink: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

function member(over: Partial<StoryCastMember>): StoryCastMember {
  return storyCastMemberSchema.parse({ id: 'x', name: 'Jad Haddad', rank: 'Oathbound II', ...over })
}

describe('CastMention', () => {
  it('links a public-armory athlete and opens an info popover on focus', () => {
    render(<CastMention member={member({ armoryHandle: 'jadhaddad' })} label="Jad Haddad" />)

    const link = screen.getByRole('link', { name: 'Jad Haddad' })
    expect(link).toHaveAttribute('href', '/armory/jadhaddad')
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.focus(link)
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Oathbound II')
    expect(tip).toHaveTextContent('@jadhaddad')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('highlights but does not link an athlete without a public handle', () => {
    render(<CastMention member={member({ armoryHandle: null })} label="Jad Haddad" />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Jad Haddad')).toBeInTheDocument()
  })
})

describe('CastText', () => {
  it('splits a paragraph into text and a linked mention', () => {
    render(
      <p>
        <CastText
          text="At dawn Jad Haddad struck."
          cast={[member({ armoryHandle: 'jadhaddad' })]}
        />
      </p>,
    )
    const link = screen.getByRole('link', { name: 'Jad Haddad' })
    expect(link).toHaveAttribute('href', '/armory/jadhaddad')
  })
})
