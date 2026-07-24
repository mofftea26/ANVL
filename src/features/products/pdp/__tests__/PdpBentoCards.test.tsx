import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import {
  PdpCareCards,
  PdpDetailCard,
  PdpMaterialCard,
} from '@/features/products/pdp/PdpBentoCards'
import type {
  ResolvedPdpCareItem,
  ResolvedPdpDetail,
  ResolvedPdpMaterial,
} from '@/features/products/pdp/resolvePdpContent'

describe('PdpMaterialCard', () => {
  it('STRUCTURED: renders name, big percentage numeral, gsm chip, and image', () => {
    const material: ResolvedPdpMaterial = {
      id: 'm1',
      name: 'Merino wool',
      percentage: 60,
      gsm: 260,
      image: 'https://cdn.example.com/macro.webp',
    }
    render(<PdpMaterialCard material={material} anchorId="pdp-materials" />)
    expect(screen.getByText('Merino wool')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('260 GSM')).toBeInTheDocument()
    const img = document.querySelector('img')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/macro.webp')
  })

  it('LEGACY: a card with no percentage/gsm omits the numeral, keeps the note', () => {
    const material: ResolvedPdpMaterial = {
      id: 'legacy',
      name: 'Premium fabric',
      percentage: null,
      gsm: null,
      note: '240 GSM heavyweight',
      image: undefined,
    }
    const { container } = render(<PdpMaterialCard material={material} />)
    expect(screen.getByText('Premium fabric')).toBeInTheDocument()
    expect(screen.getByText('240 GSM heavyweight')).toBeInTheDocument()
    // No % numeral and no image element.
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })
})

describe('PdpCareCards', () => {
  it('renders one card per care instruction with its value', () => {
    const items: ResolvedPdpCareItem[] = [
      { id: 'c1', icon: 'snowflake', name: 'Machine wash cold', value: '', note: '' },
      { id: 'c2', icon: 'washing-machine', name: 'Machine wash', value: '30', note: 'Gentle' },
    ]
    render(<PdpCareCards items={items} anchorId="pdp-care" />)
    expect(screen.getByText('Machine wash cold')).toBeInTheDocument()
    expect(screen.getByText('Machine wash')).toBeInTheDocument()
    // Numeric value formats with the °C suffix from formatCareValue.
    expect(screen.getByText('· 30°C')).toBeInTheDocument()
    expect(screen.getByText('Gentle')).toBeInTheDocument()
  })
})

describe('PdpDetailCard', () => {
  it('renders a numbered detail with title, description, and optional image', () => {
    const detail: ResolvedPdpDetail = {
      id: 'd1',
      title: 'Bonded hem',
      description: 'No stitching to chafe.',
      image: 'https://cdn.example.com/detail.webp',
    }
    const { container } = render(<PdpDetailCard detail={detail} index={2} anchorId="pdp-details" />)
    const card = container.querySelector('article')!
    expect(within(card).getByText('03')).toBeInTheDocument() // index 2 → "03"
    expect(within(card).getByText('Bonded hem')).toBeInTheDocument()
    expect(within(card).getByText('No stitching to chafe.')).toBeInTheDocument()
    const img = card.querySelector('img')!
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('loading', 'lazy')
  })
})
