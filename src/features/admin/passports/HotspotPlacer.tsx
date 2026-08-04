import { useState } from 'react'
import { Crosshair, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import { applyPlacement, MarkerPlacerCanvas } from './MarkerPlacerCanvas'

export interface HotspotDraft {
  x: number
  y: number
  title: string
  body: string
}

const NEW_HOTSPOT: HotspotDraft = { x: 50, y: 50, title: '', body: '' }

/**
 * The WHOLE-GARMENT hotspot set: tap-to-explore details a customer opens on the
 * passport render, each with its own title and story.
 *
 * Distinct from the per-section readouts in {@link SectionMarkersField} — those
 * are short label/value facts the Blueprint / Specifications / Fit effects draw
 * as furniture around the piece, three at a time. These are the customer's own
 * exploration layer and are not capped. Both pin to the same hero render
 * through the same canvas, so a coordinate means the same thing in either list.
 */
export function HotspotPlacer({
  imageUrl,
  hotspots,
  onChange,
  onGoToPiece,
}: {
  imageUrl: string | null
  hotspots: HotspotDraft[]
  onChange: (next: HotspotDraft[]) => void
  onGoToPiece?: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [moving, setMoving] = useState<number | null>(null)

  const commit = (next: HotspotDraft[], selectedIndex: number | null) => {
    onChange(next)
    setSelected(selectedIndex)
    setMoving(null)
  }

  const place = (x: number, y: number) => {
    const { next, selected: index } = applyPlacement(hotspots, moving, x, y, (px, py) => ({
      ...NEW_HOTSPOT,
      x: px,
      y: py,
    }))
    commit(next, index)
  }

  const patch = (index: number, changes: Partial<HotspotDraft>) =>
    onChange(hotspots.map((h, i) => (i === index ? { ...h, ...changes } : h)))

  const remove = (index: number) => {
    onChange(hotspots.filter((_, i) => i !== index))
    setSelected(null)
    setMoving(null)
  }

  return (
    <div className="space-y-4">
      <MarkerPlacerCanvas
        imageUrl={imageUrl}
        markers={hotspots.map((h) => ({ x: h.x, y: h.y, name: h.title }))}
        selectedIndex={selected}
        movingIndex={moving}
        onSelectMarker={(i) => setSelected(selected === i ? null : i)}
        onPlace={place}
        emptyBody="Design-detail hotspots are the markers a customer taps to explore the piece."
        onGoToPiece={onGoToPiece}
      />

      {hotspots.length === 0 ? (
        <p className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Crosshair size={ICON_SIZE.sm} aria-hidden="true" />
          No markers yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {hotspots.map((hotspot, index) => (
            <li key={index}>
              <HotspotRow
                index={index}
                hotspot={hotspot}
                selected={selected === index}
                moving={moving === index}
                onSelect={() => setSelected(index)}
                onToggleMove={() => {
                  setSelected(index)
                  setMoving(moving === index ? null : index)
                }}
                onPatch={(changes) => patch(index, changes)}
                onRemove={() => remove(index)}
              />
            </li>
          ))}
        </ul>
      )}

      {imageUrl ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          density="compact"
          onClick={() => commit([...hotspots, { ...NEW_HOTSPOT }], hotspots.length)}
        >
          <Plus size={ICON_SIZE.sm} aria-hidden="true" />
          Add detail
        </Button>
      ) : null}
    </div>
  )
}

/** One hotspot's copy + its position controls. */
function HotspotRow({
  index,
  hotspot,
  selected,
  moving,
  onSelect,
  onToggleMove,
  onPatch,
  onRemove,
}: {
  index: number
  hotspot: HotspotDraft
  selected: boolean
  moving: boolean
  onSelect: () => void
  onToggleMove: () => void
  onPatch: (changes: Partial<HotspotDraft>) => void
  onRemove: () => void
}) {
  return (
    <div
      className={cn(
        'space-y-2 rounded-xl border p-3',
        selected
          ? 'border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))]'
          : 'border-[var(--color-line)]',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="anvl-micro text-[var(--color-highlight-bright)]">
          Detail {index + 1} · {hotspot.x.toFixed(0)}% / {hotspot.y.toFixed(0)}%
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={moving ? 'primary' : 'secondary'}
            size="sm"
            density="compact"
            aria-pressed={moving}
            onClick={onToggleMove}
          >
            <Crosshair size={ICON_SIZE.xs} aria-hidden="true" />
            {moving ? 'Click the render…' : 'Move'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            density="compact"
            aria-label={`Remove detail ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2 size={ICON_SIZE.xs} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <FormField label="Detail title" labelStyle="stacked">
        <Input
          density="compact"
          value={hotspot.title}
          onFocus={onSelect}
          onChange={(e) => onPatch({ title: e.target.value })}
        />
      </FormField>
      <FormField label="Detail story" labelStyle="stacked">
        <Textarea
          rows={2}
          value={hotspot.body}
          onFocus={onSelect}
          onChange={(e) => onPatch({ body: e.target.value })}
        />
      </FormField>
    </div>
  )
}
