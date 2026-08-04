import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  TechpackUploadPanel,
  completion,
  formatElapsed,
} from '../TechpackUploadPanel'
import type { TechpackIngestProgress } from '../techpackIngest'

/**
 * Regression: `/admin/techpacks` crashed on load with
 *   "A <Select.Item /> must have a value prop that is not an empty string."
 *
 * This panel's product select offers a real "Assign later" choice whose value
 * is `''` — a placeholder cannot express it, because the user has to be able to
 * pick it back. Radix rejects that outright, so `AdminFieldSelect` swaps it for
 * an internal sentinel. This renders the panel exactly as the page does, which
 * is the level the crash actually happened at.
 */
function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <TechpackUploadPanel
        productOptions={[
          { value: 'oversized-tee', label: 'Oversized Tee' },
          { value: 'compression-tee', label: 'Compression Tee' },
        ]}
        productsLoading={false}
        onIngested={() => {}}
      />
    </QueryClientProvider>,
  )
}

describe('TechpackUploadPanel', () => {
  it('renders without throwing', () => {
    expect(() => renderPanel()).not.toThrow()
  })

  it('shows the assign-later choice on the product select', () => {
    renderPanel()
    expect(screen.getByRole('combobox', { name: /product/i })).toHaveTextContent(
      'Assign later',
    )
  })

  it('offers a file input for the PDF', () => {
    const { container } = renderPanel()
    const input = container.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    expect(input?.getAttribute('accept')).toContain('pdf')
  })
})


/**
 * The ingest's longest phase — pushing tens of megabytes at Supabase — has NO
 * progress signal, because supabase-js reports none for a standard upload. The
 * bar therefore has to distinguish "advancing", "advancing within a phase", and
 * "genuinely unmeasurable", and it must never go backwards.
 */
describe('completion', () => {
  const at = (
    phase: TechpackIngestProgress['phase'],
    over: Partial<TechpackIngestProgress> = {},
  ): TechpackIngestProgress => ({
    phase,
    page: 0,
    pageCount: 0,
    imagesStored: 0,
    message: '',
    detail: '',
    ratio: null,
    ...over,
  })

  it('never goes backwards across the phases', () => {
    const order: Array<TechpackIngestProgress['phase']> = [
      'uploading',
      'creating',
      'opening',
      'saving',
      'done',
    ]
    const values = order.map((phase) => completion(at(phase)))
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!)
    }
  })

  it('advances WITHIN a phase that reports its own ratio', () => {
    // pdf.js reports bytes while it indexes the document, so that phase should
    // creep rather than sit on its boundary for the whole read.
    const start = completion(at('opening', { ratio: 0 }))
    const middle = completion(at('opening', { ratio: 0.5 }))
    const end = completion(at('opening', { ratio: 1 }))
    expect(middle).toBeGreaterThan(start)
    expect(end).toBeGreaterThan(middle)
  })

  it('tracks pages while parsing', () => {
    const early = completion(at('parsing', { page: 1, pageCount: 13 }))
    const late = completion(at('parsing', { page: 12, pageCount: 13 }))
    expect(late).toBeGreaterThan(early)
    expect(late).toBeLessThanOrEqual(1)
  })

  it('is exactly complete when done', () => {
    expect(completion(at('done'))).toBe(1)
  })
})

describe('formatElapsed', () => {
  it('reads as seconds under a minute and clock time above', () => {
    expect(formatElapsed(0)).toBe('0s')
    expect(formatElapsed(12_400)).toBe('12s')
    expect(formatElapsed(64_000)).toBe('1:04')
    expect(formatElapsed(600_000)).toBe('10:00')
  })
})
