import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import type { ArmoryCatalogEntry } from '@/features/passport/lib/armory'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: React.ReactNode; 'aria-label'?: string }) => (
    <a href="#p" aria-label={rest['aria-label']}>
      {children}
    </a>
  ),
}))

import {
  ArmoryCollectionView,
  ArmoryLoadoutView,
  ArmoryTimelineView,
  ArmoryVaultView,
} from '@/features/storefront-account/account/panels/armory/ArmoryViews'

const catalog: ArmoryCatalogEntry[] = [
  { slug: 'oversized-tee', name: 'Oversized Tee', dropName: 'The Oath', image: 'tee.png', category: 'Tops' },
  { slug: 'stringer', name: 'Stringer', dropName: 'The Oath', image: 'str.png', category: 'Tops' },
  { slug: 'future-hoodie', name: 'Future Hoodie', dropName: 'Drop 02' },
]

const owned: OwnedPassport[] = [
  {
    id: '1',
    token: 'tok-1',
    productSlug: 'oversized-tee',
    productName: 'Oversized Tee',
    serialNumber: 3,
    editionTotal: 100,
    claimedAt: '2026-07-10T10:00:00Z',
    claimedColor: 'Onyx',
    claimedSize: 'M',
    wearCount: 0,
    lastWornAt: null,
    featuredSlot: null,
    isPublic: false,
  },
]

describe('ArmoryVaultView', () => {
  it('lights the registered slot and leaves the rest of the drop as empty sockets', () => {
    render(<ArmoryVaultView owned={owned} catalog={catalog} />)
    expect(screen.getByRole('heading', { name: 'The Oath' })).toBeTruthy()
    expect(screen.getByText('1 of 2 forged')).toBeTruthy()
    expect(screen.getByRole('link', { name: /open the oversized tee passport/i })).toBeTruthy()
    // Missing piece is present but not a link.
    expect(screen.getByText('Stringer')).toBeTruthy()
    expect(screen.getAllByText('Empty socket')).toHaveLength(1)
    // A drop you've never touched is not advertised here.
    expect(screen.queryByText('Drop 02')).toBeNull()
  })
})

describe('ArmoryCollectionView', () => {
  it('covers every drop with progress, including untouched ones', () => {
    render(<ArmoryCollectionView owned={owned} catalog={catalog} />)
    expect(screen.getByRole('heading', { name: 'The Oath' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Drop 02' })).toBeTruthy()
    const bars = screen.getAllByRole('progressbar')
    expect(bars[0]!.getAttribute('aria-valuenow')).toBe('1')
    expect(bars[0]!.getAttribute('aria-valuemax')).toBe('2')
  })
})

describe('ArmoryTimelineView', () => {
  it('lists registrations with their date', () => {
    render(<ArmoryTimelineView owned={owned} catalog={catalog} />)
    expect(screen.getByText('Oversized Tee')).toBeTruthy()
    expect(screen.getByText(/The Oath · Onyx \/ M/)).toBeTruthy()
  })
})

describe('ArmoryLoadoutView', () => {
  it('groups the kit by category', () => {
    render(<ArmoryLoadoutView owned={owned} catalog={catalog} />)
    expect(screen.getByText('Tops')).toBeTruthy()
    expect(screen.getByText('Oversized Tee')).toBeTruthy()
  })
})
