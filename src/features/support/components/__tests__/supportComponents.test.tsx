import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  resolveCareLegend,
  resolveMeasurePoints,
  resolveSupportContent,
} from '@/features/cms/support/resolveSupportContent'
import {
  DEFAULT_SUPPORT_CONTENT,
  GARMENT_TYPE_KEYS,
  type SizeProductEntry,
} from '@/features/cms/support/supportContent.zod'
import {
  CareLines,
  GARMENT_OUTLINE_VIEW_BOXES,
  CareSymbolLegend,
  ContactPanel,
  FaqAccordion,
  MeasureExplorer,
  SizeTable,
  SupportSectionList,
  faqPageJsonLd,
} from '@/features/support/components'
import { AccordionDisclosure } from '@/shared/components/ui/AccordionDisclosure'
import { formatDocDate } from '@/shared/components/premium/PageMasthead'
import { resolveGarmentTypeKeys } from '@/features/support/lib/garmentTypes'

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

  it('skips the first section header rule (the masthead already supplies one) but keeps it on later sections', () => {
    expect(content.shipping.sections.length).toBeGreaterThan(1)
    render(<SupportSectionList sections={content.shipping.sections} />)
    const headings = content.shipping.sections.map((section) =>
      screen.getByRole('heading', { name: section.heading }),
    )
    // GuideSectionHeader's outer (rule) box is the heading's grandparent —
    // the immediate parent is the flex row wrapping the heading + meta slot.
    const firstHeaderBox = headings[0]?.parentElement?.parentElement
    const laterHeaderBox = headings[1]?.parentElement?.parentElement
    expect(firstHeaderBox?.className).not.toContain('border-t')
    expect(laterHeaderBox?.className).toContain('border-t')
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

function sizeEntry(garmentType?: SizeProductEntry['garmentType']): SizeProductEntry {
  return { note: '', columns: [], rows: [], ...(garmentType ? { garmentType } : {}) }
}

describe('resolveGarmentTypeKeys', () => {
  it('always offers the tee, even with no authored products', () => {
    expect(resolveGarmentTypeKeys({})).toEqual(['tee'])
  })

  it('offers a type once at least one product uses it, in canonical order', () => {
    const keys = resolveGarmentTypeKeys({
      shorts: sizeEntry('shorts'),
      hoodie: sizeEntry('hoodie'),
    })
    expect(keys).toEqual(['tee', 'hoodie', 'shorts'])
  })

  it('does not offer a type no product uses', () => {
    expect(resolveGarmentTypeKeys({ a: sizeEntry('joggers') })).not.toContain('stringer')
  })

  it('treats a product with no chosen type as a tee', () => {
    expect(resolveGarmentTypeKeys({ a: sizeEntry() })).toEqual(['tee'])
  })
})

describe('MeasureExplorer', () => {
  const tee = resolveMeasurePoints(DEFAULT_SUPPORT_CONTENT, 'tee')
  const joggers = resolveMeasurePoints(DEFAULT_SUPPORT_CONTENT, 'joggers')

  it('renders one tab per garment type with its point count, first selected', () => {
    render(<MeasureExplorer measures={[tee, joggers]} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]?.textContent).toContain(`${tee.points.length} pts`)
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('mounts only the selected panel, so a switch replaces the figure entirely', async () => {
    const user = userEvent.setup()
    render(<MeasureExplorer measures={[tee, joggers]} />)
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    // A tee-only measurement point.
    expect(screen.getByRole('button', { name: 'Chest' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('tab')[1] as HTMLElement)

    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Chest' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inseam length' })).toBeInTheDocument()
  })

  it('moves selection with the arrow keys and wraps at the ends', async () => {
    const user = userEvent.setup()
    render(<MeasureExplorer measures={[tee, joggers]} />)
    const tabs = screen.getAllByRole('tab')
    ;(tabs[0] as HTMLElement).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowRight}')
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps and jumps across the full five-type strip', async () => {
    const user = userEvent.setup()
    const all = GARMENT_TYPE_KEYS.map((key) => resolveMeasurePoints(DEFAULT_SUPPORT_CONTENT, key))
    render(<MeasureExplorer measures={all} />)

    const selectedIndex = () =>
      screen.getAllByRole('tab').findIndex((tab) => tab.getAttribute('aria-selected') === 'true')

    expect(screen.getAllByRole('tab')).toHaveLength(GARMENT_TYPE_KEYS.length)
    expect(selectedIndex()).toBe(0)
    ;(screen.getAllByRole('tab')[0] as HTMLElement).focus()

    // Wrapping backwards off the first tab lands on the last.
    await user.keyboard('{ArrowLeft}')
    expect(selectedIndex()).toBe(GARMENT_TYPE_KEYS.length - 1)

    // ...and forwards off the last lands back on the first.
    await user.keyboard('{ArrowRight}')
    expect(selectedIndex()).toBe(0)

    await user.keyboard('{End}')
    expect(selectedIndex()).toBe(GARMENT_TYPE_KEYS.length - 1)
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)

    await user.keyboard('{Home}')
    expect(selectedIndex()).toBe(0)
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[0])
  })

  it('frames each tab silhouette by the outline bounds, not the spec-sheet box', () => {
    const all = GARMENT_TYPE_KEYS.map((key) => resolveMeasurePoints(DEFAULT_SUPPORT_CONTENT, key))
    const { container } = render(<MeasureExplorer measures={all} />)

    const tabSvgs = Array.from(container.querySelectorAll('[role="tab"] svg'))
    expect(tabSvgs).toHaveLength(GARMENT_TYPE_KEYS.length)
    tabSvgs.forEach((svg, index) => {
      const key = GARMENT_TYPE_KEYS[index] as (typeof GARMENT_TYPE_KEYS)[number]
      const box = GARMENT_OUTLINE_VIEW_BOXES[key]
      expect(svg.getAttribute('viewBox')).toBe(
        `${box.x} ${box.y} ${box.width} ${box.height}`,
      )
    })
  })

  it('omits the strip when there is nothing to switch between', () => {
    render(<MeasureExplorer measures={[tee]} />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chest' })).toBeInTheDocument()
  })
})

describe('CareSymbolLegend', () => {
  const legend = resolveCareLegend(DEFAULT_SUPPORT_CONTENT)
  const total = Object.keys(legend.entries).length

  // Real timers throughout: the search debounce is 250ms and `findBy*` polls
  // for a second, so the filtered state arrives well inside the budget. The
  // exact debounce boundary is asserted against the hook itself in
  // `careSymbolLegend.test.tsx`, where fake timers are safe to use.
  function setup() {
    const user = userEvent.setup()
    render(<CareSymbolLegend legend={legend} />)
    return user
  }

  function categories() {
    return within(screen.getByRole('group', { name: 'Filter by category' }))
  }

  it('announces the full count before any filtering', () => {
    setup()
    const status = screen.getByText(`${total} of ${total} marks`)
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('narrows the count to the search matches once the debounce elapses', async () => {
    const user = setup()
    await user.type(screen.getByLabelText('Search care symbols'), 'bleach')
    expect(await screen.findByText(`2 of ${total} marks`)).toBeInTheDocument()
  })

  it('narrows to one category when its chip is pressed, and releases it again', async () => {
    const user = setup()
    const chip = categories().getByRole('button', { name: /^Bleaching/ })
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    await user.click(chip)
    expect(categories().getByRole('button', { name: /^Bleaching/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(`2 of ${total} marks`)).toBeInTheDocument()

    await user.click(categories().getByRole('button', { name: /^Bleaching/ }))
    expect(screen.getByText(`${total} of ${total} marks`)).toBeInTheDocument()
  })

  it('shows an explicit empty state when nothing matches, and clears back to everything', async () => {
    const user = setup()
    await user.type(screen.getByLabelText('Search care symbols'), 'zzzzz')

    expect(await screen.findByText('No marks match')).toBeInTheDocument()
    expect(screen.getByText(`0 of ${total} marks`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(await screen.findByText(`${total} of ${total} marks`)).toBeInTheDocument()
    expect(screen.queryByText('No marks match')).not.toBeInTheDocument()
  })
})

describe('AccordionDisclosure', () => {
  it('opens only the disclosure asked to open by default', () => {
    const { container } = render(
      <>
        <AccordionDisclosure title="First" defaultOpen>
          <p>one</p>
        </AccordionDisclosure>
        <AccordionDisclosure title="Second">
          <p>two</p>
        </AccordionDisclosure>
      </>,
    )
    const details = container.querySelectorAll('details')
    expect(details[0]?.open).toBe(true)
    expect(details[1]?.open).toBe(false)
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
