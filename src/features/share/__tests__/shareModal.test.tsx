import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'
import type { ShareData } from '../useShareData'

const FEATS: ArmoryFeat[] = [
  {
    id: 'a',
    title: 'Deadlift PR — 240 kg',
    achievedOn: '2026-07-02',
    isPublic: true,
    productSlug: 'oath-stringer',
  },
  {
    id: 'b',
    title: 'Ran a 5k',
    achievedOn: '2026-06-02',
    isPublic: true,
    productSlug: 'forge-tee',
  },
]

const DATA: ShareData = {
  url: 'https://www.anvlathletics.com/armory/george',
  owner: {
    name: 'George Maalouf',
    rankTitle: 'Ironbound II',
    rankEmblemSrc: '/e.svg',
    memberSince: '2025-03-04',
  },
  stats: { pieceCount: 7, featCount: 2, totalWears: 48 },
  pieces: [
    { slug: 'oath-stringer', name: 'Oath Stringer', imageUrl: '/a.jpg', wearCount: 9 },
    { slug: 'forge-tee', name: 'Forge Tee', imageUrl: null, wearCount: 2 },
  ],
  feats: FEATS,
  isLoading: false,
}

const state: { data: ShareData } = { data: DATA }
/** Lets one test drive the tainted-canvas failure the sheet has to explain. */
const rendered = { dataUrl: 'data:image/png;base64,AAA' }

vi.mock('../useShareData', async () => {
  const actual = await vi.importActual<typeof import('../useShareData')>('../useShareData')
  return { ...actual, useShareData: () => state.data }
})

// The canvas engines cannot run in jsdom; they are covered by their own tests.
vi.mock('../image/shareImage', async () => {
  const actual = await vi.importActual<typeof import('../image/shareImage')>('../image/shareImage')
  return {
    ...actual,
    generateShareImage: vi.fn(async () => ({
      dataUrl: rendered.dataUrl,
      blob: null,
      width: 1080,
      height: 1920,
    })),
  }
})
// Same reason for the filmstrip's renderer — and leaving it live only floods
// the run with jsdom's "getContext not implemented" notice.
vi.mock('../image-tab/shareThumbnails', async () => {
  const actual =
    await vi.importActual<typeof import('../image-tab/shareThumbnails')>(
      '../image-tab/shareThumbnails',
    )
  return {
    ...actual,
    loadShareAssets: vi.fn(async () => ({ pieceImage: null, rankEmblem: null })),
    drawPresetThumbnail: vi.fn(() => 'data:image/jpeg;base64,TTT'),
  }
})
vi.mock('../qr/anvlQr', () => ({
  renderAnvlQr: vi.fn(async () => ({ dataUrl: 'data:image/png;base64,QQQ', blob: null, size: 1024 })),
}))

/**
 * The photo seam. jsdom cannot decode a File (no `Image.decode`, no canvas), so
 * the only way to exercise the picked-photo branch is to stand in for the hook.
 * Defaults match what the real hook returns on mount, so every other test sees
 * the untouched no-photo state.
 */
const photoState: { hasPhoto: boolean; pending: boolean; error: string | null } = {
  hasPhoto: false,
  pending: false,
  error: null,
}
const photoActions = { pick: vi.fn(), clear: vi.fn() }
vi.mock('../useImagePick', async () => {
  const actual = await vi.importActual<typeof import('../useImagePick')>('../useImagePick')
  return {
    ...actual,
    useImagePick: (): import('../useImagePick').ImagePickState => ({
      // A real canvas element, not a cast — it is only ever handed to the
      // renderers, which are mocked above.
      photo: photoState.hasPhoto ? document.createElement('canvas') : null,
      previewUrl: photoState.hasPhoto ? 'data:image/jpeg;base64,PPP' : null,
      version: photoState.hasPhoto ? 1 : 0,
      pending: photoState.pending,
      error: photoState.error,
      pick: photoActions.pick,
      clear: photoActions.clear,
    }),
  }
})

import { ShareModal } from '../ShareModal'

function resetPhoto() {
  photoState.hasPhoto = false
  photoState.pending = false
  photoState.error = null
  photoActions.pick.mockClear()
  photoActions.clear.mockClear()
}

describe('ShareModal', () => {
  beforeEach(() => {
    state.data = DATA
    rendered.dataUrl = 'data:image/png;base64,AAA'
    resetPhoto()
  })

  it('opens on the image tab', () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    expect(screen.getByRole('tab', { name: 'Image' }).getAttribute('aria-selected')).toBe('true')
  })

  /**
   * The tablist carried `role="tab"` and `aria-selected` from the start, which
   * promises assistive tech a keyboard model and a panel relationship. Neither
   * existed: no arrow keys, no roving tabindex, no `tabpanel`, no
   * `aria-controls`. The two groups INSIDE the sheet were correct all along, so
   * the one at the top of it was the only control that lied.
   */
  it('moves the tab selection with the arrow keys, not the Tab key', () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    const list = screen.getByRole('tablist', { name: /what to share/i })
    const image = within(list).getByRole('tab', { name: 'Image' })

    expect(image).toHaveAttribute('tabindex', '0')
    expect(within(list).getByRole('tab', { name: 'QR' })).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(image, { key: 'ArrowRight' })
    expect(within(list).getByRole('tab', { name: 'Link' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    fireEvent.keyDown(within(list).getByRole('tab', { name: 'Link' }), { key: 'End' })
    expect(within(list).getByRole('tab', { name: 'QR' })).toHaveAttribute('aria-selected', 'true')
  })

  it('points every tab at the panel it controls, and the panel back at the tab', () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    const panel = screen.getByRole('tabpanel')
    const image = screen.getByRole('tab', { name: 'Image' })

    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.getAttribute('aria-controls')).toBe(panel.id)
    }
    expect(panel.getAttribute('aria-labelledby')).toBe(image.id)

    fireEvent.click(screen.getByRole('tab', { name: 'QR' }))
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(
      screen.getByRole('tab', { name: 'QR' }).id,
    )
  })

  it('reaches the close button before the tabs drawn beneath it', () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    const close = screen.getByRole('button', { name: 'Close' })
    const list = screen.getByRole('tablist', { name: /what to share/i })
    // Below `lg` the tablist wraps onto the row UNDER the close button, so DOM
    // order has to put the button first or focus arrives out of reading order.
    expect(close.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('switches to the link tab and shows the armory URL, not a passport token', () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    fireEvent.click(screen.getByRole('tab', { name: 'Link' }))

    const field = screen.getByLabelText(/your public armory link/i) as HTMLInputElement
    expect(field.value).toBe(DATA.url)
    expect(field.value).not.toContain('/p/')
  })

  it('offers only the feats logged in the piece it was opened from', () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    const picker = screen.getByLabelText(/add a feat/i)
    const options = Array.from(picker.querySelectorAll('option')).map((o) => o.textContent)
    expect(options).toContain('Deadlift PR — 240 kg')
    expect(options).not.toContain('Ran a 5k')
  })

  it('has no piece picker when it was opened from a piece', () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    expect(screen.queryByLabelText(/the piece/i)).toBeNull()
  })

  it('offers a piece picker only for an armory-wide share', () => {
    render(<ShareModal open onClose={() => {}} allowPiecePicker />)
    expect(screen.getByLabelText(/the piece/i)).toBeTruthy()
  })

  it('preselects the feat it was opened with', () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" initialFeatId="a" />)
    expect((screen.getByLabelText(/add a feat/i) as HTMLSelectElement).value).toBe('a')
  })

  it('drops a selected feat that does not belong to a newly picked piece', () => {
    render(<ShareModal open onClose={() => {}} allowPiecePicker initialFeatId="a" />)
    const featPicker = screen.getByLabelText(/add a feat/i) as HTMLSelectElement
    expect(featPicker.value).toBe('a')

    fireEvent.change(screen.getByLabelText(/the piece/i), { target: { value: 'forge-tee' } })
    expect((screen.getByLabelText(/add a feat/i) as HTMLSelectElement).value).toBe('')
  })

  it('waits for the armory handle rather than rendering a broken sheet', () => {
    state.data = { ...DATA, url: null }
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    expect(screen.getByText(/preparing your armory link/i)).toBeTruthy()
  })

  it('renders the branded QR against the armory URL', async () => {
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)
    fireEvent.click(screen.getByRole('tab', { name: 'QR' }))
    expect(await screen.findByAltText(`QR code linking to ${DATA.url}`)).toBeTruthy()
  })
})

describe('ShareModal — image tab', () => {
  beforeEach(() => {
    state.data = DATA
    rendered.dataUrl = 'data:image/png;base64,AAA'
    resetPhoto()
  })

  const openSheet = () =>
    render(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)

  it('moves the format selection with the arrow keys, not the Tab key', () => {
    openSheet()
    const group = screen.getByRole('radiogroup', { name: /image size/i })
    const story = within(group).getByRole('radio', { name: /story/i })
    expect(story).toHaveAttribute('aria-checked', 'true')
    // Roving tabindex: the group is one tab stop, not three.
    expect(within(group).getByRole('radio', { name: /feed post/i })).toHaveAttribute(
      'tabindex',
      '-1',
    )

    fireEvent.keyDown(story, { key: 'ArrowRight' })
    expect(within(group).getByRole('radio', { name: /feed post/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    fireEvent.keyDown(within(group).getByRole('radio', { name: /feed post/i }), { key: 'End' })
    expect(within(group).getByRole('radio', { name: /chats & dms/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('offers all seven layouts, and moves between them with the arrow keys', () => {
    openSheet()
    const strip = screen.getByRole('radiogroup', { name: /layout/i })
    // ONE family. There is no photo-gated second set, so nothing here is
    // conditional on a photo and nothing claims otherwise.
    expect(within(strip).getAllByRole('radio')).toHaveLength(7)
    expect(screen.getByText(/7 layouts/i)).toBeTruthy()
    expect(screen.queryByText(/without a photo/i)).toBeNull()

    const rail = within(strip).getByRole('radio', { name: /rail/i })
    expect(rail).toHaveAttribute('aria-checked', 'true')
    // Roving tabindex: the strip is one tab stop, not seven.
    expect(within(strip).getByRole('radio', { name: /jarvis/i })).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(rail, { key: 'End' })
    expect(within(strip).getByRole('radio', { name: /jarvis/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(strip).getByRole('radio', { name: /rail/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('offers the same seven layouts once a photo has been added', () => {
    photoState.hasPhoto = true
    openSheet()
    const strip = screen.getByRole('radiogroup', { name: /layout/i })
    expect(within(strip).getAllByRole('radio')).toHaveLength(7)
  })

  it('keeps the chosen layout across a photo being added and removed', () => {
    const view = openSheet()
    const strip = () => screen.getByRole('radiogroup', { name: /layout/i })
    const luxe = () => within(strip()).getByRole('radio', { name: /luxe/i })
    const reopen = () =>
      view.rerender(<ShareModal open onClose={() => {}} initialPieceSlug="oath-stringer" />)

    fireEvent.click(luxe())
    expect(luxe()).toHaveAttribute('aria-checked', 'true')

    // The two-family sheet snapped the selection to the other family's default
    // on BOTH of these transitions, silently discarding the user's pick. A
    // single held preset makes the round trip lossless — pin it.
    photoState.hasPhoto = true
    reopen()
    expect(luxe()).toHaveAttribute('aria-checked', 'true')

    photoState.hasPhoto = false
    reopen()
    expect(luxe()).toHaveAttribute('aria-checked', 'true')
  })

  it('puts one icon button for adding a photo on the preview itself', () => {
    openSheet()
    const add = screen.getByRole('button', { name: /add your photo/i })
    // Icon-led: the accessible name comes from aria-label, not a text label.
    expect(add.textContent).toBe('')
    expect(add.getAttribute('type')).toBe('button')
    // The only invitation to do this job — the old card below the fold is gone.
    expect(screen.getAllByRole('button', { name: /photo/i })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /remove your photo/i })).toBeNull()
  })

  it('keeps the file picker hidden, out of the tab order, and functional', () => {
    openSheet()
    // The input is deliberately unreachable by role — the button is the control.
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    expect(input).toHaveAttribute('tabindex', '-1')
    expect(input?.accept).toBe('image/*')

    const file = new File(['x'], 'me.png', { type: 'image/png' })
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } })
    expect(photoActions.pick).toHaveBeenCalledWith(file)
    // Reset, or re-picking the same file never fires `change` again.
    expect(input?.value).toBe('')
  })

  it('swaps the add button for replace and remove once a photo is picked', () => {
    photoState.hasPhoto = true
    openSheet()

    expect(screen.queryByRole('button', { name: /add your photo/i })).toBeNull()
    const replace = screen.getByRole('button', { name: /replace your photo/i })
    const remove = screen.getByRole('button', { name: /remove your photo/i })
    expect(replace.textContent).toBe('')
    expect(remove.textContent).toBe('')

    fireEvent.click(remove)
    expect(photoActions.clear).toHaveBeenCalledTimes(1)
  })

  it('still says a photo could not be read', () => {
    photoState.error = "That photo couldn't be read — try another one."
    openSheet()
    expect(screen.getByText(/couldn.t be read/i)).toBeTruthy()
  })

  it('leads with Save when the browser cannot share files', () => {
    // jsdom has no navigator.share, so capabilities resolve to the lowest tier.
    openSheet()
    expect(screen.getByRole('button', { name: /save image/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /share image/i })).toBeNull()
  })

  it('never announces a pending render — only settled ones', async () => {
    openSheet()
    expect(screen.queryByText(/rendering/i)).toBeNull()
    expect(await screen.findByText(/preview updated — rail, story/i)).toBeTruthy()
  })

  it('explains a canvas that could not be exported instead of going dead', async () => {
    rendered.dataUrl = ''
    openSheet()
    expect(await screen.findByRole('alert')).toHaveTextContent(/can.t be exported/i)
    expect(screen.getByRole('button', { name: /save image/i })).toBeDisabled()
  })
})
