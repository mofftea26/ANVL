/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  // Minimal stub of <Link> — renders a plain <a data-tsr="..."> so we can
  // distinguish from a real external <a> in assertions.
  Link: ({
    to,
    children,
    className,
    onClick,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    onClick?: () => void
  }) => (
    <a
      data-tsr="1"
      href={to}
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  ),
}))

import { SafeLink } from '@/shared/components/ui/SafeLink'

describe('SafeLink (Phase B3 / SEC-04)', () => {
  it('renders external https URLs as <a target=_blank rel=noreferrer noopener>', () => {
    render(<SafeLink href="https://anvl.lb">click</SafeLink>)
    const a = screen.getByText('click') as HTMLAnchorElement
    expect(a.tagName).toBe('A')
    expect(a.getAttribute('href')).toBe('https://anvl.lb')
    expect(a.target).toBe('_blank')
    expect(a.rel).toBe('noreferrer noopener')
    expect(a.getAttribute('data-tsr')).toBeNull()
  })

  it('renders mailto: and tel: as external anchors', () => {
    render(
      <>
        <SafeLink href="mailto:hi@anvl.lb">mail</SafeLink>
        <SafeLink href="tel:+9611">tel</SafeLink>
      </>,
    )
    expect(screen.getByText('mail').getAttribute('href')).toBe(
      'mailto:hi@anvl.lb',
    )
    expect(screen.getByText('tel').getAttribute('href')).toBe('tel:+9611')
  })

  it('renders relative URLs as TanStack <Link>', () => {
    render(<SafeLink href="/shop">shop</SafeLink>)
    const a = screen.getByText('shop') as HTMLAnchorElement
    expect(a.getAttribute('data-tsr')).toBe('1')
    expect(a.getAttribute('href')).toBe('/shop')
    expect(a.target).toBe('')
  })

  it.each([
    ['javascript:alert(1)'],
    ['data:text/html,...'],
    ['vbscript:msgbox()'],
    ['file:///etc/passwd'],
    ['  '],
    ['anvl.lb/shop'],
    [null],
    [undefined],
  ])('downgrades %s to a non-interactive <span>', (bad) => {
    render(<SafeLink href={bad}>label</SafeLink>)
    const el = screen.getByText('label')
    expect(el.tagName).toBe('SPAN')
    expect(el.getAttribute('href')).toBeNull()
  })

  it('honors forceExternal even for relative URLs', () => {
    render(
      <SafeLink href="/shop" forceExternal>
        shop external
      </SafeLink>,
    )
    const a = screen.getByText('shop external') as HTMLAnchorElement
    expect(a.tagName).toBe('A')
    expect(a.target).toBe('_blank')
    expect(a.rel).toBe('noreferrer noopener')
    expect(a.getAttribute('data-tsr')).toBeNull()
  })
})
