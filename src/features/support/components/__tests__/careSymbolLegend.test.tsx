import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_SUPPORT_CONTENT } from '@/features/cms/support/supportContent.zod'
import { resolveCareLegend } from '@/features/cms/support/resolveSupportContent'
import {
  CARE_SYMBOL_CATEGORIES,
  CareSymbolGrid,
  CareSymbolTable,
} from '@/features/support/components'
import {
  CARE_SEARCH_DEBOUNCE_MS,
  useCareSymbolSearch,
} from '@/features/support/hooks/useCareSymbolSearch'

const legend = resolveCareLegend(DEFAULT_SUPPORT_CONTENT)
const TOTAL_SYMBOLS = CARE_SYMBOL_CATEGORIES.reduce((n, c) => n + c.keys.length, 0)

describe('useCareSymbolSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup() {
    return renderHook(() => useCareSymbolSearch(legend))
  }

  function type(result: { current: { setQuery: (v: string) => void } }, value: string) {
    act(() => result.current.setQuery(value))
    act(() => {
      vi.advanceTimersByTime(CARE_SEARCH_DEBOUNCE_MS)
    })
  }

  it('starts with every symbol, grouped by category', () => {
    const { result } = setup()
    expect(result.current.groups).toHaveLength(CARE_SYMBOL_CATEGORIES.length)
    expect(result.current.resultCount).toBe(TOTAL_SYMBOLS)
    expect(result.current.isFiltered).toBe(false)
  })

  it('does not filter until the debounce elapses', () => {
    const { result } = setup()
    act(() => result.current.setQuery('bleach'))
    expect(result.current.query).toBe('bleach')
    expect(result.current.resultCount).toBe(TOTAL_SYMBOLS)

    act(() => {
      vi.advanceTimersByTime(CARE_SEARCH_DEBOUNCE_MS - 1)
    })
    expect(result.current.resultCount).toBe(TOTAL_SYMBOLS)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.resultCount).toBe(2)
  })

  it('debounces at 250ms or more', () => {
    expect(CARE_SEARCH_DEBOUNCE_MS).toBeGreaterThanOrEqual(250)
  })

  it('matches the meaning as well as the label', () => {
    const { result } = setup()
    // "Dry flat" is the label; "holds its shape" only appears in the meaning.
    type(result, 'holds its shape')
    expect(result.current.resultCount).toBe(1)
    expect(result.current.groups[0]?.entries[0]?.key).toBe('dry-flat')
  })

  it('ignores case and surrounding whitespace', () => {
    const { result } = setup()
    type(result, '  TUMBLE  ')
    expect(result.current.resultCount).toBeGreaterThan(0)
    for (const group of result.current.groups) {
      for (const entry of group.entries) {
        expect(`${entry.label} ${entry.meaning}`.toLowerCase()).toContain('tumble')
      }
    }
  })

  it('narrows to one category and reports per-category counts for the query', () => {
    const { result } = setup()
    act(() => result.current.setCategoryId('ironing'))
    expect(result.current.groups).toHaveLength(1)
    expect(result.current.groups[0]?.id).toBe('ironing')
    expect(result.current.isFiltered).toBe(true)

    // Counts stay whole-corpus so the chips still show what else matches.
    expect(result.current.categories).toHaveLength(CARE_SYMBOL_CATEGORIES.length)
    expect(result.current.categories.reduce((n, c) => n + c.count, 0)).toBe(TOTAL_SYMBOLS)
  })

  it('reports an empty result set rather than falling back to everything', () => {
    const { result } = setup()
    type(result, 'zzzzz-no-such-symbol')
    expect(result.current.groups).toHaveLength(0)
    expect(result.current.resultCount).toBe(0)
    expect(result.current.isFiltered).toBe(true)
  })

  it('clears both the query and the category on reset', () => {
    const { result } = setup()
    type(result, 'iron')
    act(() => result.current.setCategoryId('ironing'))
    act(() => result.current.reset())
    expect(result.current.query).toBe('')
    expect(result.current.categoryId).toBeNull()
    expect(result.current.resultCount).toBe(TOTAL_SYMBOLS)
    expect(result.current.isFiltered).toBe(false)
  })
})

const bleaching = {
  id: 'bleaching',
  label: 'Bleaching',
  entries: [
    { key: 'bleach' as const, label: 'Bleach allowed', meaning: 'Bleach may be used when needed.' },
    { key: 'do-not-bleach' as const, label: 'Do not bleach', meaning: 'No bleach of any kind.' },
  ],
}

/** The popover is portalled to the body and `aria-hidden`, so read it directly. */
function openPopoverLabel(): string | null {
  return document.querySelector('[data-care-popover]')?.getAttribute('data-care-popover') ?? null
}

describe('CareSymbolGrid (view)', () => {
  it('renders a category heading and one tile per symbol', () => {
    render(<CareSymbolGrid groups={[bleaching]} />)
    expect(screen.getByRole('heading', { name: 'Bleaching', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bleach allowed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Do not bleach' })).toBeInTheDocument()
  })

  it('keeps the meaning in the accessibility tree without opening the popover', () => {
    const { container } = render(<CareSymbolGrid groups={[bleaching]} />)
    const button = screen.getByRole('button', { name: 'Bleach allowed' })
    const describedBy = button.getAttribute('aria-describedby') ?? ''
    expect(container.querySelector(`#${CSS.escape(describedBy)}`)).toHaveTextContent(
      'Bleach may be used when needed.',
    )
  })

  it('opens a popover on keyboard focus and closes it on blur', async () => {
    const user = userEvent.setup()
    render(<CareSymbolGrid groups={[bleaching]} />)
    expect(openPopoverLabel()).toBeNull()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Bleach allowed' })).toHaveFocus()
    expect(openPopoverLabel()).toBe('Bleach allowed')

    await user.tab()
    expect(openPopoverLabel()).toBe('Do not bleach')

    await user.tab()
    expect(openPopoverLabel()).toBeNull()
  })

  it('pins a popover on click and dismisses it with Escape', async () => {
    const user = userEvent.setup()
    render(<CareSymbolGrid groups={[bleaching]} />)
    const button = screen.getByRole('button', { name: 'Do not bleach' })
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('honours the requested heading level', () => {
    render(<CareSymbolGrid groups={[bleaching]} headingLevel={2} />)
    expect(screen.getByRole('heading', { name: 'Bleaching', level: 2 })).toBeInTheDocument()
  })
})

describe('CareSymbolGrid (edit)', () => {
  it('renders the caller-supplied editor for every cell instead of the popover tile', () => {
    render(
      <CareSymbolGrid
        mode="edit"
        groups={[bleaching]}
        renderEditor={({ symbolKey, label, meaning }) => (
          <label>
            {symbolKey}
            <input defaultValue={`${label}|${meaning}`} />
          </label>
        )}
      />,
    )
    expect(screen.getByLabelText('bleach')).toHaveValue(
      'Bleach allowed|Bleach may be used when needed.',
    )
    expect(screen.getByLabelText('do-not-bleach')).toBeInTheDocument()
    // No tile buttons in edit mode — the editor owns the cell.
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

describe('CareSymbolTable', () => {
  it('lists glyph rows with label and meaning under a sticky category header', () => {
    render(<CareSymbolTable groups={[bleaching]} />)
    expect(
      screen.getByRole('columnheader', { name: 'Bleaching' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Bleach allowed')).toBeInTheDocument()
    expect(screen.getByText('No bleach of any kind.')).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('renders the full resolved legend without loss', () => {
    const groups = CARE_SYMBOL_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
      entries: category.keys.map((key) => ({
        key,
        label: legend.entries[key]?.label ?? '',
        meaning: legend.entries[key]?.meaning ?? '',
      })),
    }))
    render(<CareSymbolTable groups={groups} />)
    expect(screen.getAllByRole('row')).toHaveLength(
      TOTAL_SYMBOLS + CARE_SYMBOL_CATEGORIES.length + 1,
    )
  })
})

describe('CareSymbolGrid popover precedence', () => {
  it('lets a hovered tile override a pinned one, then falls back to the pin', async () => {
    const user = userEvent.setup()
    render(<CareSymbolGrid groups={[bleaching]} />)
    await user.click(screen.getByRole('button', { name: 'Bleach allowed' }))
    expect(openPopoverLabel()).toBe('Bleach allowed')

    await user.hover(screen.getByRole('button', { name: 'Do not bleach' }))
    expect(openPopoverLabel()).toBe('Do not bleach')

    await user.unhover(screen.getByRole('button', { name: 'Do not bleach' }))
    expect(openPopoverLabel()).toBe('Bleach allowed')
  })
})

describe('CareSymbolGrid pinned-popover dismissal', () => {
  it('dismisses on Escape after focus has left the grid', async () => {
    const user = userEvent.setup()
    render(
      <>
        <CareSymbolGrid groups={[bleaching]} />
        <input aria-label="Search symbols" />
      </>,
    )
    const tile = screen.getByRole('button', { name: 'Bleach allowed' })
    await user.click(tile)
    expect(openPopoverLabel()).toBe('Bleach allowed')

    // Focus moves out of the grid; the wrapper's own onKeyDown no longer fires.
    const search = screen.getByLabelText('Search symbols')
    search.focus()
    expect(search).toHaveFocus()
    await user.keyboard('{Escape}')

    expect(openPopoverLabel()).toBeNull()
    expect(tile).toHaveAttribute('aria-pressed', 'false')
  })

  it('dismisses on a pointer press outside the grid', async () => {
    const user = userEvent.setup()
    render(
      <>
        <CareSymbolGrid groups={[bleaching]} />
        <button type="button">Elsewhere</button>
      </>,
    )
    const tile = screen.getByRole('button', { name: 'Bleach allowed' })
    await user.click(tile)
    expect(openPopoverLabel()).toBe('Bleach allowed')

    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(openPopoverLabel()).toBeNull()
    expect(tile).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps the pin when the press lands on another tile in the same grid', async () => {
    const user = userEvent.setup()
    render(<CareSymbolGrid groups={[bleaching]} />)
    await user.click(screen.getByRole('button', { name: 'Bleach allowed' }))
    await user.click(screen.getByRole('button', { name: 'Do not bleach' }))
    expect(screen.getByRole('button', { name: 'Do not bleach' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(openPopoverLabel()).toBe('Do not bleach')
  })
})

describe('useCareSymbolSearch identity', () => {
  it('keeps reset stable across renders so it is dep-array safe', () => {
    const { result, rerender } = renderHook(() => useCareSymbolSearch(legend))
    const first = result.current.reset
    act(() => result.current.setCategoryId('ironing'))
    rerender()
    expect(result.current.reset).toBe(first)
  })
})
