import { useState } from 'react'
import { ArrowDownUp, ChevronDown, ChevronUp, RotateCcw } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import {
  GARMENT_TYPE_KEYS,
  type GarmentTypeKey,
  type MeasurePoint,
  type SizeMeasure,
} from '@/features/cms/support/supportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'

const DEFAULT_MEASURE = SUPPORT_CONTENT_DEFAULTS.sizeGuide.measure

function defaultGarmentType(key: GarmentTypeKey) {
  return (
    DEFAULT_MEASURE.garmentTypes.find((g) => g.key === key) ?? DEFAULT_MEASURE.garmentTypes[0]
  )
}

/**
 * One entry per canonical point key for `garmentTypeKey`, for display only —
 * never written back until the admin actually edits or reorders. Preserves
 * whatever order the stored block already carries for keys it has, then
 * appends any canonical keys it doesn't (in the code-owned default order).
 */
function displayPoints(garmentTypeKey: GarmentTypeKey, cmsPoints: MeasurePoint[]): MeasurePoint[] {
  const defaults = defaultGarmentType(garmentTypeKey).points
  const canonicalKeys = new Set(defaults.map((p) => p.key))
  const byKey = new Map(cmsPoints.map((p) => [p.key, p]))
  const ordered = cmsPoints.filter((p) => canonicalKeys.has(p.key))
  const seen = new Set(ordered.map((p) => p.key))
  for (const fallback of defaults) {
    if (!seen.has(fallback.key)) {
      ordered.push(byKey.get(fallback.key) ?? { key: fallback.key, letter: '', label: '', description: '' })
    }
  }
  return ordered
}

interface MeasurementsFieldProps {
  measure: SizeMeasure
  onChange: (next: SizeMeasure) => void
}

/**
 * "Where we measure" editor: heading/intro/footnote, plus — per garment type —
 * a label and its fixed set of measurement points (letter, label, description).
 * Point KEYS and per-type membership are code-owned (`GARMENT_SCHEMATICS` draws
 * the geometry; `resolveMeasurePoints` always renders in that code-owned
 * order) — the CMS can only edit copy for a point that already exists, never
 * add or remove one. Reordering here only changes the stored array's order,
 * which has no rendering effect, but is kept for a consistent editing feel
 * with the other reorderable list editors. "Reset to defaults" for a type
 * deletes its whole override block rather than blanking each field one by one.
 */
export function MeasurementsField({ measure, onChange }: MeasurementsFieldProps) {
  const [activeType, setActiveType] = useState<GarmentTypeKey>(GARMENT_TYPE_KEYS[0])

  const patchMeasure = (patch: Partial<SizeMeasure>) => onChange({ ...measure, ...patch })

  const cmsBlock = measure.garmentTypes.find((g) => g.key === activeType)
  const defaultBlock = defaultGarmentType(activeType)
  const points = displayPoints(activeType, cmsBlock?.points ?? [])
  const hasOverride = Boolean(cmsBlock)

  const patchBlock = (patch: Partial<{ label: string; points: MeasurePoint[] }>) => {
    const next = { key: activeType, label: cmsBlock?.label ?? '', points, ...patch }
    const exists = measure.garmentTypes.some((g) => g.key === activeType)
    patchMeasure({
      garmentTypes: exists
        ? measure.garmentTypes.map((g) => (g.key === activeType ? next : g))
        : [...measure.garmentTypes, next],
    })
  }

  const patchPoint = (key: MeasurePoint['key'], patch: Partial<Omit<MeasurePoint, 'key'>>) =>
    patchBlock({ points: points.map((p) => (p.key === key ? { ...p, ...patch } : p)) })

  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...points]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    patchBlock({ points: next })
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: points.length,
    onMove: move,
  })

  const resetType = () =>
    patchMeasure({ garmentTypes: measure.garmentTypes.filter((g) => g.key !== activeType) })

  return (
    <div className="space-y-4">
      <FormField label="Heading" labelStyle="stacked">
        <Input
          density="compact"
          placeholder={DEFAULT_MEASURE.heading}
          value={measure.heading}
          onChange={(e) => patchMeasure({ heading: e.target.value })}
        />
      </FormField>
      <FormField label="Intro" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={2}
          placeholder={DEFAULT_MEASURE.intro}
          value={measure.intro}
          onChange={(e) => patchMeasure({ intro: e.target.value })}
        />
      </FormField>
      <FormField
        label="Footnote"
        hint="Shown under the point list — e.g. the half-measurement note."
        labelStyle="stacked"
      >
        <Textarea
          density="compact"
          rows={2}
          placeholder={DEFAULT_MEASURE.footnote}
          value={measure.footnote}
          onChange={(e) => patchMeasure({ footnote: e.target.value })}
        />
      </FormField>

      <AdminFieldSelect
        label="Garment type"
        value={activeType}
        onChange={(value) => setActiveType(value as GarmentTypeKey)}
        options={GARMENT_TYPE_KEYS.map((key) => ({
          value: key,
          label: defaultGarmentType(key).label,
          description: `${defaultGarmentType(key).points.length} points`,
        }))}
      />

      <div className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3">
        <div className="flex items-end justify-between gap-2">
          <FormField label="Type label" labelStyle="micro" className="flex-1">
            <Input
              density="compact"
              placeholder={defaultBlock.label}
              value={cmsBlock?.label ?? ''}
              onChange={(e) => patchBlock({ label: e.target.value })}
            />
          </FormField>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            density="compact"
            onClick={resetType}
            disabled={!hasOverride}
          >
            <RotateCcw size={ICON_SIZE.sm} aria-hidden="true" />
            Reset to defaults
          </Button>
        </div>

        <div className="space-y-3">
          {points.map((point, index) => {
            const fallback = defaultBlock.points.find((p) => p.key === point.key)
            return (
              <div
                key={point.key}
                {...getItemProps(index)}
                className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 data-[drag-over]:border-[var(--color-accent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    {...getHandleProps(index)}
                    aria-label={`Drag to reorder point ${index + 1}`}
                    className="focus-ring inline-flex cursor-grab items-center gap-1.5 rounded px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] active:cursor-grabbing"
                  >
                    <ArrowDownUp size={ICON_SIZE.sm} aria-hidden="true" />
                    Point {fallback?.letter || index + 1}
                  </button>
                  <div className="flex items-center gap-1">
                    <IconButton
                      type="button"
                      size="sm"
                      aria-label={`Move point ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => moveUp(index)}
                    >
                      <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      type="button"
                      size="sm"
                      aria-label={`Move point ${index + 1} down`}
                      disabled={index === points.length - 1}
                      onClick={() => moveDown(index)}
                    >
                      <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
                    </IconButton>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
                  <FormField label="Letter" labelStyle="micro">
                    <Input
                      density="compact"
                      placeholder={fallback?.letter}
                      value={point.letter}
                      aria-label={`${point.key} point letter`}
                      onChange={(e) => patchPoint(point.key, { letter: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Label" labelStyle="micro">
                    <Input
                      density="compact"
                      placeholder={fallback?.label}
                      value={point.label}
                      aria-label={`${point.key} point label`}
                      onChange={(e) => patchPoint(point.key, { label: e.target.value })}
                    />
                  </FormField>
                </div>
                <FormField label="Description" labelStyle="micro">
                  <Textarea
                    density="compact"
                    rows={2}
                    placeholder={fallback?.description}
                    value={point.description}
                    aria-label={`${point.key} point description`}
                    onChange={(e) => patchPoint(point.key, { description: e.target.value })}
                  />
                </FormField>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
