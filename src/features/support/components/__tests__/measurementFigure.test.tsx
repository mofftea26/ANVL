import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  GARMENT_TYPE_KEYS,
  SIZE_TABLE_ROW_KEYS,
  DEFAULT_SUPPORT_CONTENT,
  type GarmentTypeKey,
} from '@/features/cms/support/supportContent.zod'
import { resolveMeasurePoints } from '@/features/cms/support/resolveSupportContent'
import {
  GARMENT_OUTLINE_VIEW_BOXES,
  GARMENT_SCHEMATICS,
  MeasurementFigure,
  SizeDiagram,
  computeOutlineViewBox,
  anchorBadgePoint,
  getGarmentSchematic,
  isGarmentTypeKey,
} from '@/features/support/components'

function pointsFor(key: GarmentTypeKey) {
  return resolveMeasurePoints(DEFAULT_SUPPORT_CONTENT, key)
}

describe('garment schematic registry', () => {
  it('ships a schematic for every garment type key', () => {
    for (const key of GARMENT_TYPE_KEYS) {
      expect(GARMENT_SCHEMATICS[key].key).toBe(key)
      expect(GARMENT_SCHEMATICS[key].outline.length).toBeGreaterThan(0)
    }
  })

  it('anchors only measurement keys the garment type actually carries', () => {
    for (const key of GARMENT_TYPE_KEYS) {
      const resolvedKeys = pointsFor(key).points.map((point) => point.key)
      const anchorKeys = Object.keys(GARMENT_SCHEMATICS[key].anchors)
      expect(anchorKeys.length).toBeGreaterThan(0)
      for (const anchorKey of anchorKeys) {
        expect(SIZE_TABLE_ROW_KEYS).toContain(anchorKey)
        expect(resolvedKeys).toContain(anchorKey)
      }
    }
  })

  it('carries fewer anchors on the reduced garment types', () => {
    expect(Object.keys(GARMENT_SCHEMATICS.tee.anchors)).toHaveLength(7)
    expect(Object.keys(GARMENT_SCHEMATICS.stringer.anchors)).toHaveLength(5)
    expect(Object.keys(GARMENT_SCHEMATICS.joggers.anchors)).toHaveLength(4)
    expect(Object.keys(GARMENT_SCHEMATICS.shorts.anchors)).toHaveLength(3)
  })

  it('draws its outlines with absolute M/L/C/Z only, which the bounds parser assumes', () => {
    for (const key of GARMENT_TYPE_KEYS) {
      const commands = GARMENT_SCHEMATICS[key].outline.match(/[A-Za-z]/g) ?? []
      expect(commands.length).toBeGreaterThan(0)
      for (const command of commands) {
        expect(['M', 'L', 'C', 'Z']).toContain(command)
      }
    }
  })

  it('frames each outline tighter than the spec-sheet box it is drawn on', () => {
    for (const key of GARMENT_TYPE_KEYS) {
      const sheet = GARMENT_SCHEMATICS[key].viewBox
      const tight = GARMENT_OUTLINE_VIEW_BOXES[key]
      expect(tight.width).toBeLessThan(sheet.width)
      expect(tight.height).toBeLessThan(sheet.height)
      // The garment itself must sit inside the sheet it is drawn on. Measured
      // unpadded: the tab's breathing room is decorative and may overhang the
      // sheet, which is harmless because the tab renders this box standalone.
      const raw = computeOutlineViewBox(GARMENT_SCHEMATICS[key].outline, 0)
      expect(raw.x).toBeGreaterThanOrEqual(sheet.x)
      expect(raw.y).toBeGreaterThanOrEqual(sheet.y)
      expect(raw.x + raw.width).toBeLessThanOrEqual(sheet.x + sheet.width)
      expect(raw.y + raw.height).toBeLessThanOrEqual(sheet.y + sheet.height)
    }
  })

  it('renders every silhouette centred and filling its dominant axis in a square tab', () => {
    // Replicates preserveAspectRatio="xMidYMid meet" into the tab's 36px box.
    // This is the regression guard for pointing the tab back at the spec-sheet
    // viewBox, which lands each garment at a different scale and centre.
    const BOX = 36
    for (const key of GARMENT_TYPE_KEYS) {
      const box = GARMENT_OUTLINE_VIEW_BOXES[key]
      const scale = Math.min(BOX / box.width, BOX / box.height)
      const width = box.width * scale
      const height = box.height * scale
      expect(width / 2 + (BOX - width) / 2).toBeCloseTo(BOX / 2, 6)
      expect(height / 2 + (BOX - height) / 2).toBeCloseTo(BOX / 2, 6)
      expect(Math.max(width, height)).toBeCloseTo(BOX, 6)
    }
  })

  it('takes a cubic segment true extremum, not its control hull', () => {
    // The tee's neckline: endpoints at y=94, control points at y=118, and the
    // curve itself only reaches y=112. A control-hull box would read 118.
    const box = computeOutlineViewBox('M252 94 C258 118 302 118 308 94 Z')
    const padding = box.x + box.width - 308
    expect(padding).toBeGreaterThan(0)
    expect(box.x + padding).toBeCloseTo(252, 6)
    expect(box.y + padding).toBeCloseTo(94, 6)
    expect(box.y + box.height - padding).toBeCloseTo(112, 6)
  })

  it('pads a plain rectangle symmetrically', () => {
    const box = computeOutlineViewBox('M0 0 L100 0 L100 50 L0 50 Z')
    const padding = (box.width - 100) / 2
    expect(padding).toBeGreaterThan(0)
    expect(box.x).toBeCloseTo(-padding, 6)
    expect(box.y).toBeCloseTo(-padding, 6)
    expect(box.height).toBeCloseTo(50 + padding * 2, 6)
  })

  it('keeps every viewBox in one aspect-ratio family so tabs do not resize the frame', () => {
    // All five render into the same `w-full max-h-[26rem]` box under
    // preserveAspectRatio="meet". A ratio below ~0.86 letterboxes the drawing
    // narrower than the panel around it, which reads as broken layout.
    for (const key of GARMENT_TYPE_KEYS) {
      const { width, height } = GARMENT_SCHEMATICS[key].viewBox
      expect(width / height).toBeGreaterThanOrEqual(0.85)
    }
  })

  it('keeps every badge disc inside its own viewBox at the active radius', () => {
    const ACTIVE_RADIUS = 15
    for (const key of GARMENT_TYPE_KEYS) {
      const { viewBox, anchors } = GARMENT_SCHEMATICS[key]
      for (const [measureKey, anchor] of Object.entries(anchors)) {
        if (!anchor) continue
        const badge = anchorBadgePoint(anchor)
        const where = `${key}.${measureKey}`
        expect(badge.x - ACTIVE_RADIUS, where).toBeGreaterThanOrEqual(viewBox.x)
        expect(badge.x + ACTIVE_RADIUS, where).toBeLessThanOrEqual(viewBox.x + viewBox.width)
        expect(badge.y - ACTIVE_RADIUS, where).toBeGreaterThanOrEqual(viewBox.y)
        expect(badge.y + ACTIVE_RADIUS, where).toBeLessThanOrEqual(viewBox.y + viewBox.height)
      }
    }
  })

  it('keeps the joggers cuff badge clear of the hem', () => {
    // Regression: the default midpoint badge straddled the rib band, so at the
    // active radius the disc overhung the silhouette and blanked the band line.
    const JOGGERS_HEM_Y = 460
    const cuff = GARMENT_SCHEMATICS.joggers.anchors.cuff
    expect(cuff).toBeDefined()
    expect(anchorBadgePoint(cuff!).y + 15).toBeLessThan(JOGGERS_HEM_Y)
  })

  it('falls back to the tee for unknown keys, matching the resolver', () => {
    expect(getGarmentSchematic('not-a-garment').key).toBe('tee')
    expect(getGarmentSchematic('').key).toBe('tee')
    expect(getGarmentSchematic('hoodie').key).toBe('hoodie')
    expect(isGarmentTypeKey('hoodie')).toBe(true)
    expect(isGarmentTypeKey('cape')).toBe(false)
  })

  it('defaults a badge to the dimension line midpoint', () => {
    expect(anchorBadgePoint({ from: { x: 0, y: 10 }, to: { x: 100, y: 30 } })).toEqual({
      x: 50,
      y: 20,
    })
    expect(
      anchorBadgePoint({ from: { x: 0, y: 0 }, to: { x: 10, y: 0 }, badge: { x: 4, y: 9 } }),
    ).toEqual({ x: 4, y: 9 })
  })
})

describe('MeasurementFigure', () => {
  const tee = pointsFor('tee')

  function renderTee() {
    return render(
      <MeasurementFigure
        garmentTypeKey={tee.garmentTypeKey}
        garmentTypeLabel={tee.garmentTypeLabel}
        points={tee.points}
        footnote={tee.footnote}
      />,
    )
  }

  it('renders one keyboard-reachable row per measurement point', () => {
    renderTee()
    for (const point of tee.points) {
      expect(screen.getByRole('button', { name: point.label })).toBeInTheDocument()
    }
  })

  it('describes each row with its measurement description', () => {
    const { container } = renderTee()
    const first = tee.points[0]
    const button = screen.getByRole('button', { name: first.label })
    const describedBy = button.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(container.querySelector(`#${CSS.escape(describedBy ?? '')}`)).toHaveTextContent(
      first.description,
    )
  })

  it('hides the drawing from assistive tech — the list is the source of truth', () => {
    const { container } = renderTee()
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role', 'img')
  })

  it('lights the matching dimension line when a row takes focus', async () => {
    const user = userEvent.setup()
    const { container } = renderTee()
    expect(container.querySelector('[data-measure-key="chest"][data-active]')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Chest' }))

    expect(
      container.querySelector('svg [data-measure-key="chest"][data-active="true"]'),
    ).not.toBeNull()
    expect(container.querySelector('svg [data-measure-key="waist"][data-active]')).toBeNull()
  })

  it('pins and unpins a row on click so touch works without hover', async () => {
    const user = userEvent.setup()
    renderTee()
    const button = screen.getByRole('button', { name: 'Waist' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders a reduced garment type without breaking on its missing points', () => {
    const joggers = pointsFor('joggers')
    const { container } = render(
      <MeasurementFigure
        garmentTypeKey={joggers.garmentTypeKey}
        garmentTypeLabel={joggers.garmentTypeLabel}
        points={joggers.points}
      />,
    )
    expect(joggers.points).toHaveLength(4)
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.queryByRole('button', { name: 'Chest' })).toBeNull()
    expect(container.querySelectorAll('svg [data-measure-key]')).toHaveLength(4)
  })

  it('draws only the points that have anchors, never throwing on one that does not', () => {
    const shorts = pointsFor('shorts')
    const withOrphan = [
      ...shorts.points,
      { key: 'collar' as const, letter: 'Z', label: 'Neck opening', description: 'Not drawn.' },
    ]
    const { container } = render(
      <MeasurementFigure garmentTypeKey="shorts" garmentTypeLabel="Shorts" points={withOrphan} />,
    )
    // The orphan point is still listed — the list is the accessible source of truth.
    expect(screen.getByRole('button', { name: 'Neck opening' })).toBeInTheDocument()
    // ...but it has no geometry on the shorts schematic, so nothing is drawn for it.
    expect(container.querySelectorAll('svg [data-measure-key]')).toHaveLength(3)
  })
})

describe('SizeDiagram', () => {
  it('exposes the drawing as a labelled image naming every lettered point', () => {
    render(<SizeDiagram garmentTypeKey="tee" points={pointsFor('tee').points} />)
    const image = screen.getByRole('img')
    const label = image.getAttribute('aria-label') ?? ''
    expect(label).toContain('tee')
    for (const point of pointsFor('tee').points) {
      expect(label).toContain(point.label.toLowerCase())
    }
  })

  it('selects the schematic for the requested garment type', () => {
    render(<SizeDiagram garmentTypeKey="hoodie" points={pointsFor('hoodie').points} />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('hoodie')
  })

  it('namespaces every SVG def id so two instances never collide', () => {
    const { container } = render(
      <>
        <SizeDiagram garmentTypeKey="tee" points={pointsFor('tee').points} />
        <SizeDiagram garmentTypeKey="joggers" points={pointsFor('joggers').points} />
      </>,
    )
    const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(container.querySelectorAll('marker').length).toBe(4)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
