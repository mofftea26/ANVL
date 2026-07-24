import { ArrowDownUp, ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { makeSectionId } from '@/features/admin/components/SectionListField'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import type { PdpMaterial } from '@/features/cms/pdpContent/pdpContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'

interface PdpMaterialsFieldProps {
  materials: PdpMaterial[]
  onChange: (next: PdpMaterial[]) => void
  assets: CmsMediaAsset[]
}

function blankMaterial(): PdpMaterial {
  return { id: makeSectionId('material'), name: '', percentage: null, gsm: null, image: '' }
}

/** Parse a numeric input into a bounded number, or null when blank/invalid. */
function parseNumber(raw: string, opts: { min?: number; max?: number }): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return null
  if (opts.min != null && value < opts.min) return opts.min
  if (opts.max != null && value > opts.max) return opts.max
  return value
}

/**
 * Structured fabric-composition editor: each row carries a material name, a
 * composition percentage (0–100), a GSM weight (positive), and an optional
 * card image (via the media library). Rows add / delete / drag-reorder (with
 * the keyboard up/down fallback, same contract as {@link CareSelector}). A
 * non-blocking hint appears when the authored percentages don't sum to 100.
 */
export function PdpMaterialsField({ materials, onChange, assets }: PdpMaterialsFieldProps) {
  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...materials]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: materials.length,
    onMove: move,
  })

  const patch = (index: number, patchValue: Partial<PdpMaterial>) =>
    onChange(materials.map((item, i) => (i === index ? { ...item, ...patchValue } : item)))
  const remove = (index: number) => onChange(materials.filter((_, i) => i !== index))

  const percentTotal = materials.reduce((sum, m) => sum + (m.percentage ?? 0), 0)
  const showSumHint =
    materials.some((m) => m.percentage !== null) && Math.round(percentTotal) !== 100

  return (
    <div className="space-y-3">
      {materials.map((material, index) => (
        <div
          key={material.id || index}
          {...getItemProps(index)}
          className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 data-[drag-over]:border-[var(--color-accent)]"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              {...getHandleProps(index)}
              aria-label={`Drag to reorder material ${index + 1}`}
              className="focus-ring inline-flex cursor-grab items-center gap-1.5 rounded px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] active:cursor-grabbing"
            >
              <ArrowDownUp size={ICON_SIZE.sm} aria-hidden="true" />
              Material {index + 1}
            </button>
            <div className="flex items-center gap-1">
              <IconButton
                type="button"
                size="sm"
                aria-label={`Move material ${index + 1} up`}
                disabled={index === 0}
                onClick={() => moveUp(index)}
              >
                <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                aria-label={`Move material ${index + 1} down`}
                disabled={index === materials.length - 1}
                onClick={() => moveDown(index)}
              >
                <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                aria-label={`Remove material ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Material" labelStyle="micro">
              <Input
                density="compact"
                placeholder="e.g. Combed cotton"
                value={material.name}
                onChange={(e) => patch(index, { name: e.target.value })}
                aria-label={`Material ${index + 1} name`}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Percentage" labelStyle="micro">
                <Input
                  density="compact"
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  placeholder="0–100"
                  value={material.percentage ?? ''}
                  onChange={(e) =>
                    patch(index, { percentage: parseNumber(e.target.value, { min: 0, max: 100 }) })
                  }
                  aria-label={`Material ${index + 1} percentage`}
                />
              </FormField>
              <FormField label="GSM" labelStyle="micro">
                <Input
                  density="compact"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="e.g. 240"
                  value={material.gsm ?? ''}
                  onChange={(e) => patch(index, { gsm: parseNumber(e.target.value, { min: 1 }) })}
                  aria-label={`Material ${index + 1} GSM`}
                />
              </FormField>
            </div>
          </div>

          <MediaLibrarySlotField
            label="Image (optional)"
            kind="image"
            assets={assets}
            mediaId={material.image}
            onMediaIdChange={(id) => patch(index, { image: id })}
          />
        </div>
      ))}

      {showSumHint ? (
        <p className="text-xs text-[var(--color-text-muted)]" role="note">
          Composition adds up to {Math.round(percentTotal)}% — not 100%. That&rsquo;s fine, just a heads-up.
        </p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        density="compact"
        onClick={() => onChange([...materials, blankMaterial()])}
      >
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        Add material
      </Button>
    </div>
  )
}
