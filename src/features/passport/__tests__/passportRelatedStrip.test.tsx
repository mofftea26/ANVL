import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { PassportRelated } from '@/features/passport/lib/relatedProducts'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'

// The strip filters candidates by the owner's registrations via this hook.
const ownedRef: { current: OwnedPassport[] } = { current: [] }
vi.mock('@/features/passport/hooks/usePassport', () => ({
  useOwnedPassportsQuery: () => ({ data: ownedRef.current }),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, params }: { children: React.ReactNode; params?: { slug: string } }) => (
    <a href={`/shop/${params?.slug ?? ''}`}>{children}</a>
  ),
}))

import { PassportRelatedStrip } from '@/features/passport/components/PassportRelatedStrip'

const related: PassportRelated = {
  dropName: 'The Oath',
  dropMates: [
    { slug: 'compression-tee', name: 'Compression Tee', image: 'comp.png' },
    { slug: 'stringer', name: 'Stringer', image: 'str.png' },
  ],
  categoryMates: [{ slug: 'compression-tee', name: 'Compression Tee', image: 'comp.png' }],
}

function owns(...slugs: string[]): OwnedPassport[] {
  return slugs.map((slug, i) => ({
    id: `p${i}`,
    token: `t${i}`,
    productSlug: slug,
    productName: slug,
    serialNumber: 1,
    editionTotal: 100,
    claimedAt: null,
    claimedColor: null,
    claimedSize: null,
  }))
}

describe('PassportRelatedStrip — drop mode', () => {
  it('lists the unregistered pieces of the drop, linking to the shop PDP', () => {
    ownedRef.current = owns('compression-tee')
    render(<PassportRelatedStrip mode="drop" related={related} />)
    expect(screen.getByText('Stringer')).toBeTruthy()
    // Already-owned piece is filtered out.
    expect(screen.queryByText('Compression Tee')).toBeNull()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/shop/stringer')
  })

  it('shows a completion seal once the whole drop is registered', () => {
    ownedRef.current = owns('compression-tee', 'stringer')
    render(<PassportRelatedStrip mode="drop" related={related} />)
    expect(screen.getByText(/The Oath — complete/)).toBeTruthy()
    expect(screen.queryByText('Stringer')).toBeNull()
  })
})

describe('PassportRelatedStrip — category mode', () => {
  it('acknowledges quietly when every matching piece is owned (no seal)', () => {
    ownedRef.current = owns('compression-tee')
    render(<PassportRelatedStrip mode="category" related={related} />)
    expect(screen.getByText(/every matching piece is already in your armory/i)).toBeTruthy()
  })
})
