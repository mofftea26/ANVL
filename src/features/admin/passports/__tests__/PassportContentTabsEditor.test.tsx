/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AdminPageActionsProvider,
  useAdminPageActionsSlot,
} from '@/features/admin/components/AdminPageActionsContext'
import {
  DEFAULT_PASSPORT_CONTENT,
  DEFAULT_PASSPORT_PRODUCT_CONTENT,
  type PassportContentConfig,
} from '@/features/cms/passportContent/passportContent.zod'

// Same rationale as SiteFontEditor.test.tsx: the 11-tab editor is a huge cold
// import, and in a full parallel run its first render reliably blows the 15s
// default on a loaded machine (green in isolation, red only at the tail of
// `pnpm test`). 60s still catches a genuine hang.
vi.setConfig({ testTimeout: 60_000 })

let storedConfig: PassportContentConfig = { ...DEFAULT_PASSPORT_CONTENT }
const listeners = new Set<() => void>()
const saveAsync = vi.fn()

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/features/cms/passportContent/passportContent.settings', () => ({
  readPassportContentFromStorage: () => storedConfig,
  subscribePassportContentChange: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  savePassportContentAsync: async (next: PassportContentConfig) => {
    saveAsync(next)
    storedConfig = next
    for (const listener of listeners) listener()
  },
}))

vi.mock('@/features/admin/hooks/useAdminProductCatalogQuery', () => ({
  useAdminProductCatalogQuery: () => ({
    data: { items: [{ slug: 'oath-tee', name: 'Oath Tee' }], drops: [] },
    isLoading: false,
  }),
}))

const HERO_ASSET = {
  id: 'media-hero',
  storagePath: 'passport/hero.png',
  filename: 'passport-hero.png',
  alt: '',
  mime: 'image/png',
  byteSize: 1024,
  width: 1200,
  height: 1600,
  tags: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  createdBy: null,
}

vi.mock('@/features/admin/media/useMediaAssetsQuery', () => ({
  useMediaAssetsQuery: () => ({ data: [HERO_ASSET], isLoading: false }),
}))

// The real URL builder needs the Supabase public env, which the test env has
// no business carrying. Only the id → URL step is stubbed; everything else in
// the media service stays real.
vi.mock('@/features/admin/media/mediaAssets.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/admin/media/mediaAssets.service')>()),
  mediaAssetPublicUrl: () => 'https://cdn.example.com/hero.png',
}))

// The editor renders a `<Link>` back to the picker — stub it (no router here).
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
  }
})

function TopbarActionsProbe() {
  const actions = useAdminPageActionsSlot()
  return <div data-testid="admin-page-actions">{actions}</div>
}

async function renderEditor() {
  const { PassportContentTabsEditor } = await import('../PassportContentTabsEditor')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AdminPageActionsProvider>
        <TopbarActionsProbe />
        <PassportContentTabsEditor productSlug="oath-tee" />
      </AdminPageActionsProvider>
    </QueryClientProvider>,
  )
}

describe('PassportContentTabsEditor', () => {
  beforeEach(() => {
    storedConfig = { ...DEFAULT_PASSPORT_CONTENT }
    listeners.clear()
    saveAsync.mockReset()
  })

  it('renders the sections as a tablist (not a modal)', async () => {
    await renderEditor()
    const tablist = screen.getByRole('tablist', { name: 'Passport sections' })
    const tabs = within(tablist).getAllByRole('tab')
    expect(tabs.length).toBe(11)
    expect(within(tablist).getByRole('tab', { name: 'Identity' })).toBeTruthy()
    expect(within(tablist).getByRole('tab', { name: 'Blueprint' })).toBeTruthy()
    expect(within(tablist).getByRole('tab', { name: 'Fit & sizing' })).toBeTruthy()
    // The old modal wizard dialog must be gone.
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('edits a section and saves it into passport_content for the slug', async () => {
    const user = userEvent.setup()
    await renderEditor()

    // Identity is the default tab — its first textbox is the tagline.
    const tagline = screen.getAllByRole('textbox')[0]!
    await user.type(tagline, 'Forged under pressure')

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save passport/i }))

    await waitFor(() => {
      expect(saveAsync).toHaveBeenCalledTimes(1)
    })
    const saved = saveAsync.mock.calls[0]![0] as PassportContentConfig
    expect(saved['oath-tee']?.identity.tagline).toBe('Forged under pressure')
  })

  it('switches tabs and edits a different section', async () => {
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole('tab', { name: 'Specifications' }))
    // Specs renders 6 plain inputs (Construction first); FormField labels aren't
    // wired via htmlFor, so target the first textbox in the now-active panel.
    const construction = screen.getAllByRole('textbox')[0]!
    await user.type(construction, 'Flatlock seams')

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save passport/i }))

    await waitFor(() => expect(saveAsync).toHaveBeenCalled())
    const saved = saveAsync.mock.calls[0]![0] as PassportContentConfig
    expect(saved['oath-tee']?.specs.construction).toBe('Flatlock seams')
  })
})

/**
 * The marker editor was previously one global tab called "Design details",
 * eighth in the strip, and the per-section marker lists had no UI at all — so
 * an editor working on Blueprint had no way to reach the thing that positions
 * Blueprint's readouts. These pin the fix.
 */
describe('PassportContentTabsEditor — placing markers', () => {
  beforeEach(() => {
    storedConfig = { ...DEFAULT_PASSPORT_CONTENT }
    listeners.clear()
    saveAsync.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  /** Give the render a real box so a click maps to a known percentage. */
  function mockImageBox() {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 400,
      right: 200,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => '',
    } as DOMRect)
  }

  function seedHeroRender() {
    storedConfig = {
      'oath-tee': {
        ...structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
        piece: { heroRender: 'media-hero', gallery: [] },
      },
    }
  }

  it('names the whole-garment marker tab "Hotspots" and puts it beside the render', async () => {
    await renderEditor()
    const tabs = within(screen.getByRole('tablist', { name: 'Passport sections' })).getAllByRole('tab')
    const titles = tabs.map((tab) => tab.textContent)

    expect(titles).toContain('Hotspots')
    // Searchable name, and adjacent to the tab that assigns the image it pins to.
    expect(titles.indexOf('Hotspots')).toBe(titles.indexOf('The piece') + 1)
    expect(titles).not.toContain('Design details')
  })

  it('saves a marker placed on the Blueprint tab into blueprint.points', async () => {
    seedHeroRender()
    mockImageBox()
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole('tab', { name: 'Blueprint' }))
    const panel = screen.getByRole('tabpanel')
    const render_ = within(panel).getByRole('presentation', { hidden: true })
    fireEvent.click(render_.parentElement!, { clientX: 100, clientY: 100 })

    await user.type(within(panel).getByRole('textbox', { name: 'Plate 1 label' }), 'Flatlock')

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save passport/i }))

    await waitFor(() => expect(saveAsync).toHaveBeenCalled())
    const saved = saveAsync.mock.calls[0]![0] as PassportContentConfig
    expect(saved['oath-tee']?.blueprint.points).toEqual([
      { x: 50, y: 25, label: 'Flatlock', value: '' },
    ])
  })

  it('keeps the three section marker lists independent', async () => {
    seedHeroRender()
    mockImageBox()
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole('tab', { name: 'Specifications' }))
    const specsPanel = screen.getByRole('tabpanel')
    const specsRender = within(specsPanel).getByRole('presentation', { hidden: true })
    fireEvent.click(specsRender.parentElement!, { clientX: 50, clientY: 200 })

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save passport/i }))

    await waitFor(() => expect(saveAsync).toHaveBeenCalled())
    const saved = saveAsync.mock.calls[0]![0] as PassportContentConfig
    // A chip placed on Specifications is a spec — it must not leak into the
    // Blueprint hologram or the Fit tapes.
    expect(saved['oath-tee']?.specs.points).toHaveLength(1)
    expect(saved['oath-tee']?.blueprint.points).toEqual([])
    expect(saved['oath-tee']?.fit.points).toEqual([])
  })

  it('sends the editor to The piece when there is no render to place on', async () => {
    // No hero render seeded — the placer must explain the blocker and fix it,
    // not render a dead paragraph that reads as a broken editor.
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole('tab', { name: 'Fit & sizing' }))
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByText(/no hero render to place markers on/i)).toBeTruthy()

    await user.click(within(panel).getByRole('button', { name: /open .the piece./i }))

    expect(screen.getByRole('tab', { name: 'The piece' }).getAttribute('aria-selected')).toBe(
      'true',
    )
  })
})
