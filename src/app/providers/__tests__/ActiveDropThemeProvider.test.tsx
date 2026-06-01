import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ActiveDropThemeProvider } from '@/app/providers/ActiveDropThemeProvider'
import { ACTIVE_DROP_THEME_STYLE_ID } from '@/features/cms/theme/dropPaletteStyle'
import type { Drop } from '@/features/drops/drop.types'

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: vi.fn(() => null),
}))

const dropWithTheme = {
  id: 'drop-1',
  updatedAt: '2026-05-01T00:00:00.000Z',
  theme: {
    colors: {
      background: '#111111',
      surface: '#222222',
      surfaceSoft: '#333333',
      line: '#444444',
      text: '#eeeeee',
      mutedText: '#999999',
      heading: '#ffffff',
      accent: '#cccccc',
      accentSoft: '#555555',
      heroGlow: '#666666',
    },
  },
} as Drop

function renderProvider(
  ui: ReactNode,
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) {
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
}

describe('ActiveDropThemeProvider', () => {
  it('injects drop palette style tag by default', () => {
    const html = renderProvider(
      <ActiveDropThemeProvider initialDrop={dropWithTheme}>
        <span>child</span>
      </ActiveDropThemeProvider>,
    )
    expect(html).toContain(`id="${ACTIVE_DROP_THEME_STYLE_ID}"`)
    expect(html).toContain('--color-bg: #111111')
  })

  it('skips drop palette when applyDropTheme is false', () => {
    const html = renderProvider(
      <ActiveDropThemeProvider initialDrop={dropWithTheme} applyDropTheme={false}>
        <span>child</span>
      </ActiveDropThemeProvider>,
    )
    expect(html).not.toContain(`id="${ACTIVE_DROP_THEME_STYLE_ID}"`)
    expect(html).not.toContain('--color-bg: #111111')
    expect(html).toContain('child')
  })
})
