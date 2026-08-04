import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GlobalSearchDropdown } from '@/features/search/components/GlobalSearchDropdown'
import type { GroupedResults, SearchResult } from '@/features/search/types/search.types'

function armoryResult(handle: string, displayName: string): SearchResult {
  return {
    score: 0,
    matches: [],
    document: {
      id: `armory-${handle}`,
      type: 'armory',
      title: displayName,
      subtitle: `@${handle}`,
      body: '',
      url: `/armory/${handle}`,
      meta: { handle },
    },
  }
}

function renderDropdown(results: GroupedResults) {
  return render(
    <GlobalSearchDropdown
      results={results}
      query="geo"
      isLoading={false}
      activeIndex={-1}
      onSelect={vi.fn()}
      onSeeAll={vi.fn()}
      listboxId="search-listbox"
      resultId={(index) => `search-option-${index}`}
    />,
  )
}

describe('GlobalSearchDropdown — the Warriors group', () => {
  it('renders armory hits under a Warriors heading with name + @handle rows', () => {
    renderDropdown({ armory: [armoryResult('iron-warrior', 'George M.')] })
    expect(screen.getByText('Warriors')).toBeTruthy()
    const row = screen.getByRole('option', { name: /george m\./i })
    expect(row.textContent).toContain('@iron-warrior')
  })

  it('renders no Warriors group when there are no armory hits', () => {
    renderDropdown({
      product: [
        {
          score: 0,
          matches: [],
          document: {
            id: 'product-tee',
            type: 'product',
            title: 'Oversized Tee',
            body: '',
            url: '/shop/tee',
            meta: { slug: 'tee' },
          },
        },
      ],
    })
    expect(screen.queryByText('Warriors')).toBeNull()
    expect(screen.getByText('Products')).toBeTruthy()
  })
})
