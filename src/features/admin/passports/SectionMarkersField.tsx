import { useState } from 'react'
import { Crosshair, Plus } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { cn } from '@/shared/lib/cn'
import { applyPlacement, MarkerPlacerCanvas } from './MarkerPlacerCanvas'
import { SortableRow } from './passportListFields'

/** The shared marker shape — `blueprint.points`, `specs.points`, `fit.points`. */
type PassportMarker = PassportProductContent['blueprint']['points'][number]

/**
 * How many markers each section's effect can actually draw.
 *
 * All three cap at three plates/chips/bands on the console and two on the
 * phone sheet (`MAX_HOLO_TAGS`, `ANCHOR_RECIPES`, `TIER_CONFIG`). Restated as
 * a plain number rather than imported: those constants live in the WebGL
 * effect modules, and importing them would pull three.js into the admin
 * bundle to display a hint. If an effect's budget changes, change it here.
 */
const DRAWN_MARKER_COUNT = 3

const NEW_MARKER: PassportMarker = { x: 50, y: 50, label: '', value: '' }

/**
 * The per-section marker authoring block: the product render with click-to-place
 * dots, above a label/value row per dot.
 *
 * Rendered INSIDE the tab that owns the markers (Blueprint, Specifications,
 * Fit) rather than in one shared tab. The three lists are independent — a
 * construction callout, a spec and a measurement each belong to their own
 * section — and an editor authoring Blueprint should not have to know that
 * some other tab is where its geometry lives.
 */
export function SectionMarkersField({
  label,
  hint,
  imageUrl,
  markers,
  onChange,
  onGoToPiece,
  rowLabel,
  addLabel,
  labelPlaceholder,
  valuePlaceholder,
  emptyBody,
}: {
  label: string
  /** What this section's effect does with the markers, in the editor's words. */
  hint: string
  imageUrl: string | null
  markers: PassportMarker[]
  onChange: (next: PassportMarker[]) => void
  onGoToPiece?: () => void
  rowLabel: string
  addLabel: string
  labelPlaceholder: string
  valuePlaceholder: string
  emptyBody: string
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [moving, setMoving] = useState<number | null>(null)

  const commit = (next: PassportMarker[], selectedIndex: number | null) => {
    onChange(next)
    setSelected(selectedIndex)
    setMoving(null)
  }

  const place = (x: number, y: number) => {
    const { next, selected: index } = applyPlacement(markers, moving, x, y, (px, py) => ({
      ...NEW_MARKER,
      x: px,
      y: py,
    }))
    commit(next, index)
  }

  const patchMarker = (index: number, value: Partial<PassportMarker>) =>
    onChange(markers.map((m, i) => (i === index ? { ...m, ...value } : m)))

  const remove = (index: number) => {
    onChange(markers.filter((_, i) => i !== index))
    setSelected(null)
    setMoving(null)
  }

  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: markers.length,
    onMove: (from, to) => {
      if (from === to) return
      const next = [...markers]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item!)
      commit(next, to)
    },
  })

  return (
    <FormField label={label} hint={hint} labelStyle="stacked">
      <div className="space-y-4">
        <MarkerPlacerCanvas
          imageUrl={imageUrl}
          markers={markers.map((m) => ({ x: m.x, y: m.y, name: m.label || m.value }))}
          selectedIndex={selected}
          movingIndex={moving}
          onSelectMarker={(i) => setSelected(selected === i ? null : i)}
          onPlace={place}
          dimFrom={DRAWN_MARKER_COUNT}
          emptyBody={emptyBody}
          onGoToPiece={onGoToPiece}
        />

        {markers.length === 0 ? (
          <p className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Crosshair size={ICON_SIZE.sm} aria-hidden="true" />
            No markers yet.
          </p>
        ) : (
          <div className="space-y-3">
            {markers.map((marker, index) => (
              <SortableRow
                key={index}
                index={index}
                total={markers.length}
                label={rowLabel}
                getHandleProps={getHandleProps}
                getItemProps={getItemProps}
                moveUp={moveUp}
                moveDown={moveDown}
                onRemove={remove}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'anvl-micro',
                      selected === index
                        ? 'text-[var(--color-highlight-bright)]'
                        : 'text-[var(--color-text-muted)]',
                    )}
                  >
                    {marker.x.toFixed(0)}% / {marker.y.toFixed(0)}%
                  </span>
                  <Button
                    type="button"
                    variant={moving === index ? 'primary' : 'secondary'}
                    size="sm"
                    density="compact"
                    aria-pressed={moving === index}
                    onClick={() => {
                      setSelected(index)
                      setMoving(moving === index ? null : index)
                    }}
                  >
                    <Crosshair size={ICON_SIZE.xs} aria-hidden="true" />
                    {moving === index ? 'Click the render…' : 'Move'}
                  </Button>
                  {/* Say it plainly rather than letting an editor place a
                      fourth marker and wonder why it never appears. */}
                  {index >= DRAWN_MARKER_COUNT ? (
                    <span className="anvl-micro text-[var(--color-text-muted)]">
                      Not drawn
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    density="compact"
                    aria-label={`${rowLabel} ${index + 1} label`}
                    placeholder={labelPlaceholder}
                    value={marker.label}
                    onFocus={() => setSelected(index)}
                    onChange={(e) => patchMarker(index, { label: e.target.value })}
                  />
                  <Input
                    density="compact"
                    aria-label={`${rowLabel} ${index + 1} value`}
                    placeholder={valuePlaceholder}
                    value={marker.value}
                    onFocus={() => setSelected(index)}
                    onChange={(e) => patchMarker(index, { value: e.target.value })}
                  />
                </div>
              </SortableRow>
            ))}
          </div>
        )}

        {imageUrl ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              density="compact"
              onClick={() => commit([...markers, { ...NEW_MARKER }], markers.length)}
            >
              <Plus size={ICON_SIZE.sm} aria-hidden="true" />
              {addLabel}
            </Button>
            <p className="text-xs text-[var(--color-text-muted)]">
              The first {DRAWN_MARKER_COUNT} are drawn ({DRAWN_MARKER_COUNT - 1} on
              phones) — reorder to choose which.
            </p>
          </div>
        ) : null}
      </div>
    </FormField>
  )
}
