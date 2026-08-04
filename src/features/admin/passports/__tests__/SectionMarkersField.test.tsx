/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import { applyPlacement } from '../MarkerPlacerCanvas'
import { SectionMarkersField } from '../SectionMarkersField'

type Marker = PassportProductContent['blueprint']['points'][number]

const IMAGE = 'https://cdn.example.com/hero.png'

/** The rendered image box, so a click maps to a predictable percentage. */
const BOX = { left: 0, top: 0, width: 200, height: 400 }

function mockImageBox() {
  return vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockReturnValue({
      ...BOX,
      right: BOX.width,
      bottom: BOX.height,
      x: 0,
      y: 0,
      toJSON: () => '',
    } as DOMRect)
}

function renderField(
  markers: Marker[],
  overrides: Partial<Parameters<typeof SectionMarkersField>[0]> = {},
) {
  const onChange = vi.fn<(next: Marker[]) => void>()
  render(
    <SectionMarkersField
      label="Spec plates on the render"
      hint="Click the render where a fact lands."
      imageUrl={IMAGE}
      markers={markers}
      onChange={onChange}
      rowLabel="Plate"
      addLabel="Add plate"
      labelPlaceholder="Label"
      valuePlaceholder="Value"
      emptyBody="Spec plates are the readouts the hologram hangs."
      {...overrides}
    />,
  )
  return { onChange }
}

/** The click target is the render itself — the box wrapping the <img>. */
function clickRender(clientX: number, clientY: number) {
  const image = screen.getByRole('presentation', { hidden: true })
  fireEvent.click(image.parentElement!, { clientX, clientY })
}

describe('applyPlacement', () => {
  const at = (x: number, y: number): Marker => ({ x, y, label: '', value: '' })

  it('appends a point when nothing is armed for moving', () => {
    const existing = [at(10, 10)]
    const { next, selected } = applyPlacement(existing, null, 40, 60, at)
    expect(next).toHaveLength(2)
    expect(next[1]).toMatchObject({ x: 40, y: 60 })
    expect(selected).toBe(1)
  })

  it('moves the armed point instead of appending, keeping its copy', () => {
    const existing: Marker[] = [
      { x: 10, y: 10, label: 'Flatlock', value: '6-thread' },
      at(80, 80),
    ]
    const { next, selected } = applyPlacement(existing, 0, 40, 60, at)
    expect(next).toHaveLength(2)
    expect(next[0]).toEqual({ x: 40, y: 60, label: 'Flatlock', value: '6-thread' })
    expect(selected).toBe(0)
  })

  it('appends when the armed index no longer exists (list shrank under it)', () => {
    const { next } = applyPlacement([at(10, 10)], 7, 40, 60, at)
    expect(next).toHaveLength(2)
  })
})

describe('SectionMarkersField', () => {
  afterEach(() => vi.restoreAllMocks())

  it('adds a marker at the clicked percentage of the image box', () => {
    mockImageBox()
    const { onChange } = renderField([])

    clickRender(100, 100)

    // 100/200 across, 100/400 down.
    expect(onChange).toHaveBeenCalledWith([{ x: 50, y: 25, label: '', value: '' }])
  })

  it('repositions an existing marker once its Move button is armed', async () => {
    mockImageBox()
    const user = userEvent.setup()
    const { onChange } = renderField([{ x: 10, y: 10, label: 'Flatlock', value: '6-thread' }])

    await user.click(screen.getByRole('button', { name: 'Move' }))
    clickRender(100, 300)

    // Moved, not appended — and the copy rode along.
    expect(onChange).toHaveBeenCalledWith([
      { x: 50, y: 75, label: 'Flatlock', value: '6-thread' },
    ])
  })

  it('edits a marker label and value without disturbing its position', async () => {
    mockImageBox()
    const user = userEvent.setup()
    const { onChange } = renderField([{ x: 31.5, y: 18.25, label: '', value: '' }])

    await user.type(screen.getByRole('textbox', { name: 'Plate 1 label' }), 'W')

    expect(onChange).toHaveBeenCalledWith([
      { x: 31.5, y: 18.25, label: 'W', value: '' },
    ])
  })

  it('warns that markers past the effect budget are not drawn', () => {
    mockImageBox()
    const marker = (label: string): Marker => ({ x: 50, y: 50, label, value: '' })
    renderField([marker('a'), marker('b'), marker('c'), marker('d')])

    // Only the fourth is beyond what the effect can draw.
    expect(screen.getAllByText('Not drawn')).toHaveLength(1)
  })

  it('blocks placement with an actionable empty state when no render is assigned', async () => {
    const user = userEvent.setup()
    const onGoToPiece = vi.fn()
    renderField([], { imageUrl: null, onGoToPiece })

    // It must say what is missing, not just fail to draw an editor.
    expect(screen.getByText(/no hero render to place markers on/i)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /open .the piece./i }))
    expect(onGoToPiece).toHaveBeenCalledTimes(1)
  })

  it('rejects an unsafe image src rather than putting it in the DOM', () => {
    renderField([], { imageUrl: 'javascript:alert(1)' })
    expect(screen.getByText(/no hero render to place markers on/i)).toBeTruthy()
    expect(screen.queryByRole('presentation', { hidden: true })).toBeNull()
  })
})
