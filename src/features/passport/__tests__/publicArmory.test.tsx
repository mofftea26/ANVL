import { describe, expect, it, vi } from 'vitest'
import { render as rtlRender, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { publicArmorySchema } from '@/features/passport/schemas/passport.schema'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

import { PublicArmoryView } from '@/features/passport/components/PublicArmoryView'

// The view reads gamification rules via React Query (placeholder = defaults).
function render(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('publicArmorySchema', () => {
  it('parses the RPC projection and ignores fields it does not expose', () => {
    // The RPC only ever returns safe fields; even if extra keys appeared, the
    // schema keeps just the public projection (no token/serial/user_id).
    const parsed = publicArmorySchema.parse({
      owner_name: 'Test Warrior',
      total_pieces: 3,
      pieces: [
        {
          product_slug: 'oversized-tee',
          product_name: 'Oversized Tee',
          claimed_at: '2026-07-10T10:00:00Z',
          claimed_color: 'Onyx',
          claimed_size: 'M',
          wear_count: 12,
          featured_slot: 1,
        },
      ],
      feats: [{ title: 'Deadlift PR — 240 kg', achieved_on: '2026-07-01', product_slug: 'oversized-tee' }],
    })
    expect(parsed.ownerName).toBe('Test Warrior')
    expect(parsed.totalPieces).toBe(3)
    expect(parsed.pieces[0]).toMatchObject({ productName: 'Oversized Tee', wearCount: 12 })
    expect(parsed.pieces[0]).not.toHaveProperty('token')
    expect(parsed.feats[0]!.title).toBe('Deadlift PR — 240 kg')
  })

  it('defaults empty pieces/feats', () => {
    const parsed = publicArmorySchema.parse({ owner_name: 'A', total_pieces: 0 })
    expect(parsed.pieces).toEqual([])
    expect(parsed.feats).toEqual([])
  })
})

describe('PublicArmoryView (read-only)', () => {
  const armory = publicArmorySchema.parse({
    owner_name: 'Test Warrior',
    total_pieces: 2,
    pieces: [
      {
        product_slug: 'oversized-tee',
        product_name: 'Oversized Tee',
        claimed_at: '2026-07-10T10:00:00Z',
        claimed_color: 'Onyx',
        claimed_size: 'M',
        wear_count: 12,
        featured_slot: 1,
      },
    ],
    feats: [{ title: 'Deadlift PR — 240 kg', achieved_on: '2026-07-01', product_slug: 'oversized-tee' }],
  })

  it('renders the athlete, pedestal Hall of Honor, and per-piece feats — read-only', () => {
    render(<PublicArmoryView armory={armory} images={{ 'oversized-tee': 'tee.png' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Test Warrior' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Hall of Honor' })).toBeTruthy()
    expect(screen.getAllByText('Oversized Tee').length).toBeGreaterThan(0)
    // The record numbers strip (sr-only dt + visible label).
    expect(screen.getAllByText('Wears logged').length).toBeGreaterThan(0)
    // The feat renders on its piece's card back (it's tied to a shared slug).
    expect(screen.getByText(/Deadlift PR — 240 kg/)).toBeTruthy()
    expect(screen.queryByText(/more feats/i)).toBeNull()
    // Read-only: no wear button, no pin.
    expect(screen.queryByRole('button', { name: /wore it/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /hall of honor/i })).toBeNull()
  })

  it('flips a collection card to its service record and back', async () => {
    const { fireEvent } = await import('@testing-library/react')
    const { container } = render(
      <PublicArmoryView armory={armory} images={{ 'oversized-tee': 'tee.png' }} />,
    )
    const back = container.querySelector('[inert]')
    // The record face starts hidden behind the art.
    expect(back?.getAttribute('aria-hidden')).toBe('true')
    fireEvent.click(
      screen.getByRole('button', { name: /flip to see the record of oversized tee/i }),
    )
    expect(back?.getAttribute('aria-hidden')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: /flip back to the card art/i }))
    expect(back?.getAttribute('aria-hidden')).toBe('true')
  })
})

/**
 * Legibility guards for the identity card. These assert on class attributes,
 * which the house rules normally forbid — but the regression they cover (a 96px
 * watermark sitting on top of 9px labels on a phone) has no behavioural surface
 * in jsdom: Tailwind's stylesheet is never loaded, so `getComputedStyle` returns
 * nothing for font-size, colour or z-index. The class attribute is the only
 * observable evidence, and the alternative is no guard at all.
 */
describe('PublicArmoryView — identity card legibility', () => {
  const armory = publicArmorySchema.parse({
    owner_name: 'Test Warrior',
    total_pieces: 2,
    pieces: [
      {
        product_slug: 'oversized-tee',
        product_name: 'Oversized Tee',
        claimed_at: '2026-07-10T10:00:00Z',
        claimed_color: null,
        claimed_size: null,
        wear_count: 12,
        featured_slot: 1,
      },
    ],
    feats: [
      { title: 'Deadlift PR — 240 kg', achieved_on: '2026-07-01', product_slug: 'oversized-tee' },
    ],
  })

  const classOf = (el: Element) => el.getAttribute('class') ?? ''

  function renderCard() {
    const { container } = render(<PublicArmoryView armory={armory} images={{}} />)
    const header = container.querySelector('header')
    expect(header).toBeTruthy()
    const watermark = [...header!.querySelectorAll('span')].find(
      (el) => el.textContent === 'ARMORY',
    )
    expect(watermark).toBeTruthy()
    return { container, header: header!, watermark: watermark! }
  }

  it('keeps the ARMORY watermark decorative and layered under the content', () => {
    const { header, watermark } = renderCard()
    // Never announced, never interactive — it is pure ornament.
    expect(watermark.getAttribute('aria-hidden')).toBe('true')
    expect(classOf(watermark)).toContain('pointer-events-none')
    // Explicit stacking, not DOM-order luck: mark on z-0, content on z-10.
    expect(classOf(watermark)).toMatch(/(^|\s)z-0(\s|$)/)
    const stats = header.querySelector('dl')
    expect(stats?.closest('[class~="z-10"]')).toBeTruthy()
  })

  it('sizes and parks the watermark per breakpoint so a phone card is never covered', () => {
    const { watermark } = renderCard()
    const cls = classOf(watermark)
    // Base (phone) must not be the 96px slab, and must not sit bottom-right
    // where the stat strip lives once the card is a single column.
    expect(cls).toMatch(/(^|\s)text-4xl(\s|$)/)
    expect(cls).not.toMatch(/(^|\s)(text-8xl|-bottom-6|right-0)(\s|$)/)
    // The designed bottom-right slab returns only once the card becomes a row.
    expect(cls).toMatch(/(^|\s)md:-bottom-6(\s|$)/)
    expect(cls).toMatch(/(^|\s)md:right-0(\s|$)/)
    expect(cls).toMatch(/(^|\s)lg:text-8xl(\s|$)/)
  })

  it('renders each record-number label as visible text at a readable size', () => {
    const { header } = renderCard()
    const labels = [...header.querySelectorAll('dd')].filter((el) =>
      ['Pieces forged', 'Wears logged', 'Feat'].includes(el.textContent ?? ''),
    )
    expect(labels).toHaveLength(3)
    for (const label of labels) {
      // Visible, not folded into the sr-only <dt> that carries the same words.
      expect(classOf(label)).not.toContain('sr-only')
      expect(classOf(label)).toContain('text-[11px]')
      // Ink mixed toward --color-heading rather than the raw muted token, and
      // `.anvl-micro` dropped — unlayered, it would outrank both utilities.
      expect(classOf(label)).toContain('var(--color-heading)')
      expect(classOf(label)).not.toMatch(/(^|\s)anvl-micro(\s|$)/)
    }
  })

  it('leaves no sub-11px text anywhere in the card or on the honor pedestals', () => {
    const { header, container } = renderCard()
    // Scoped to the surfaces this view owns — the collection's TCG cards are a
    // sibling component with its own type scale.
    const scopes = [header, ...container.querySelectorAll('figure')]
    const tooSmall = scopes.flatMap((scope) =>
      [...scope.querySelectorAll('*')]
        .filter((el) => /text-\[([0-9]|10)px\]/.test(classOf(el)))
        .map((el) => `${el.tagName}: ${el.textContent}`),
    )
    expect(tooSmall).toEqual([])
  })
})
