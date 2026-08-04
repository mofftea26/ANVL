import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_SUPPORT_CONTENT } from '@/features/cms/support/supportContent.zod'
import { resolveSupportContent } from '@/features/cms/support/resolveSupportContent'
import { FaqForge } from '@/features/support/components/faq/FaqForge'
import {
  filterFaqItems,
  highlightSegments,
  normalizeFaqQuery,
} from '@/features/support/components/faq/faqSearch'

const content = resolveSupportContent(DEFAULT_SUPPORT_CONTENT)
const items = content.faq.items

describe('faqSearch', () => {
  it('normalizes queries and passes everything through when blank', () => {
    expect(normalizeFaqQuery('  Ship  ')).toBe('ship')
    expect(filterFaqItems(items, '   ')).toHaveLength(items.length)
  })

  it('matches against both the question and the answer, case-insensitively', () => {
    const target = items[0]!
    const byQuestion = filterFaqItems(items, target.question.slice(0, 8).toUpperCase())
    expect(byQuestion.map((i) => i.id)).toContain(target.id)

    const noMatch = filterFaqItems(items, 'zzzznotathinganywhere')
    expect(noMatch).toHaveLength(0)
  })

  it('splits text into segments that re-join to the original', () => {
    const segments = highlightSegments('Ship it, then ship it again', 'ship')
    expect(segments.map((s) => s.text).join('')).toBe('Ship it, then ship it again')
    expect(segments.filter((s) => s.match).map((s) => s.text)).toEqual(['Ship', 'ship'])
  })

  it('returns one unmatched segment for a blank query', () => {
    expect(highlightSegments('Cold wash only', '')).toEqual([
      { text: 'Cold wash only', match: false },
    ])
  })
})

describe('FaqForge', () => {
  it('renders one collapsed disclosure per question', () => {
    render(<FaqForge items={items} />)
    const triggers = screen.getAllByRole('button', { expanded: false })
    expect(triggers).toHaveLength(items.length)
    for (const item of items) {
      expect(screen.getByRole('button', { name: new RegExp(escapeRe(item.question)) })).toBeInTheDocument()
    }
  })

  it('opens a plate on click and closes it on a second click', async () => {
    const user = userEvent.setup()
    render(<FaqForge items={items} />)
    const trigger = screen.getByRole('button', { name: new RegExp(escapeRe(items[0]!.question)) })

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps only one plate open at a time', async () => {
    const user = userEvent.setup()
    render(<FaqForge items={items} />)
    const first = screen.getByRole('button', { name: new RegExp(escapeRe(items[0]!.question)) })
    const second = screen.getByRole('button', { name: new RegExp(escapeRe(items[1]!.question)) })

    await user.click(first)
    await user.click(second)

    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(second).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps collapsed answers in the DOM but hidden from assistive tech', () => {
    render(<FaqForge items={items} />)
    const panel = document.getElementById(`faq-panel-${items[0]!.id}`)
    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('aria-hidden', 'true')
    // The answer text ships in the SSR markup for crawlers.
    expect(panel?.textContent?.length ?? 0).toBeGreaterThan(0)
  })

  it('filters the stack as you search and shows an empty state with no hits', async () => {
    const user = userEvent.setup()
    const { container } = render(<FaqForge items={items} />)
    const field = screen.getByLabelText('Search the FAQ')

    // Open a plate first: the conduit's heat must go dark when its row is
    // filtered away, or it floats lit beside the empty state.
    await user.click(screen.getByRole('button', { name: new RegExp(escapeRe(items[0]!.question)) }))

    await user.type(field, 'zzzznotathinganywhere')
    expect(screen.queryAllByRole('button', { expanded: false })).toHaveLength(0)
    expect(screen.getByText(/Nothing forged yet/i)).toBeInTheDocument()
    expect(container.querySelector<HTMLElement>('.anvl-faq-rail-heat')?.style.opacity).toBe('0')

    // Clearing restores the whole stack — and the plate that was open before
    // the search is still open, so its heat comes back too.
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(container.querySelectorAll('.anvl-faq-plate')).toHaveLength(items.length)
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1)
  })

  it('always emits FAQPage JSON-LD for every item, even while filtered', async () => {
    const user = userEvent.setup()
    const { container } = render(<FaqForge items={items} />)
    await user.type(screen.getByLabelText('Search the FAQ'), 'zzzznotathinganywhere')

    const script = container.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(script?.textContent ?? '{}') as { mainEntity: unknown[] }
    expect(data.mainEntity).toHaveLength(items.length)
  })

  it('moves focus between plates with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<FaqForge items={items} />)
    const first = screen.getByRole('button', { name: new RegExp(escapeRe(items[0]!.question)) })
    const second = screen.getByRole('button', { name: new RegExp(escapeRe(items[1]!.question)) })

    first.focus()
    await user.keyboard('{ArrowDown}')
    expect(second).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(first).toHaveFocus()
  })

  it('marks search hits inside the question text', async () => {
    const user = userEvent.setup()
    const single = [{ id: 'ship', question: 'How fast is shipping?', answer: 'Two days.' }]
    render(<FaqForge items={single} />)

    await user.type(screen.getByLabelText('Search the FAQ'), 'ship')
    const trigger = screen.getByRole('button', { name: /How fast is shipping/ })
    expect(within(trigger).getByText('ship')).toHaveClass('anvl-faq-mark')
  })

  it('renders nothing when there are no items', () => {
    const { container } = render(<FaqForge items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
