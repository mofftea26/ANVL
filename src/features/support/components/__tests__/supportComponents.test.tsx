import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { resolveSupportContent } from '@/features/cms/support/resolveSupportContent'
import { DEFAULT_SUPPORT_CONTENT } from '@/features/cms/support/supportContent.zod'
import {
  CareLines,
  ContactPanel,
  FaqAccordion,
  SizeTable,
  SupportSectionList,
  faqPageJsonLd,
  formatDocDate,
} from '@/features/support/components'

const content = resolveSupportContent(DEFAULT_SUPPORT_CONTENT)

describe('FaqAccordion', () => {
  it('renders every resolved FAQ question', () => {
    render(<FaqAccordion items={content.faq.items} />)
    for (const item of content.faq.items) {
      expect(screen.getByText(item.question)).toBeInTheDocument()
    }
    expect(content.faq.items.length).toBeGreaterThan(0)
  })

  it('emits FAQPage JSON-LD with one entry per item', () => {
    const data = faqPageJsonLd(content.faq.items)
    expect(data['@type']).toBe('FAQPage')
    expect((data.mainEntity as unknown[]).length).toBe(content.faq.items.length)
  })
})

describe('SupportSectionList', () => {
  it('renders resolved shipping section headings', () => {
    render(<SupportSectionList sections={content.shipping.sections} />)
    expect(screen.getByRole('heading', { name: 'Processing time' })).toBeInTheDocument()
  })
})

describe('ContactPanel', () => {
  it('renders a mailto link for the resolved contact email', () => {
    render(<ContactPanel contact={content.contact} />)
    const link = screen.getByRole('link', { name: content.contact.email })
    expect(link).toHaveAttribute('href', `mailto:${content.contact.email}`)
  })
})

describe('SizeTable', () => {
  it('renders a Size column plus authored measurement columns and rows', () => {
    render(
      <SizeTable
        entry={{
          note: 'Measured flat.',
          columns: ['Chest (cm)', 'Length (cm)'],
          rows: [{ id: 'm', size: 'M', values: ['54', '72'] }],
        }}
      />,
    )
    const table = screen.getByRole('table')
    expect(within(table).getByText('Size')).toBeInTheDocument()
    expect(within(table).getByText('Chest (cm)')).toBeInTheDocument()
    expect(within(table).getByText('54')).toBeInTheDocument()
  })
})

describe('CareLines', () => {
  it('renders legacy care lines as generic items', () => {
    render(<CareLines entry={{ note: 'Cold wash.', lines: ['Hang dry', 'No bleach'], items: [] }} />)
    expect(screen.getByText('Hang dry')).toBeInTheDocument()
    expect(screen.getByText('No bleach')).toBeInTheDocument()
  })

  it('prefers structured items (with value + note) over legacy lines', () => {
    render(
      <CareLines
        entry={{
          note: '',
          lines: ['legacy only'],
          items: [
            { id: 'i1', icon: 'washing-machine', name: 'Machine wash', value: '30', note: 'Inside out' },
          ],
        }}
      />,
    )
    expect(screen.getByText('Machine wash')).toBeInTheDocument()
    expect(screen.getByText(/30°C/)).toBeInTheDocument()
    expect(screen.getByText('Inside out')).toBeInTheDocument()
    expect(screen.queryByText('legacy only')).not.toBeInTheDocument()
  })
})

describe('SizeTable (structured)', () => {
  it('prefers the structured fixed grid with measurement labels and the half-measurement hint', () => {
    render(
      <SizeTable
        entry={{
          note: '',
          columns: ['Chest (cm)'],
          rows: [{ id: 'm', size: 'M', values: ['54'] }],
          table: {
            rows: [{ key: 'chest', values: ['50', '52', '54', '56', '', ''] }],
            halfMeasurement: true,
          },
        }}
      />,
    )
    const table = screen.getByRole('table')
    expect(within(table).getByText('Measurement (cm)')).toBeInTheDocument()
    expect(within(table).getByText('Chest')).toBeInTheDocument()
    expect(within(table).getByText('XXL')).toBeInTheDocument()
    expect(within(table).getByText('52')).toBeInTheDocument()
    expect(screen.getByText(/half measurements/i)).toBeInTheDocument()
    // Legacy shape is not rendered when structured data exists.
    expect(screen.queryByText('Chest (cm)')).not.toBeInTheDocument()
  })
})

describe('formatDocDate', () => {
  it('formats an ISO date deterministically', () => {
    expect(formatDocDate('2026-07-19')).toBe('July 19, 2026')
  })
  it('returns empty for non-date input', () => {
    expect(formatDocDate('')).toBe('')
    expect(formatDocDate('nope')).toBe('')
  })
})
