import { ArrowDownUp, ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { makeSectionId } from '@/features/admin/components/SectionListField'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import type { PdpDetail } from '@/features/cms/pdpContent/pdpContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui'

interface PdpDetailsFieldProps {
  details: PdpDetail[]
  onChange: (next: PdpDetail[]) => void
  assets: CmsMediaAsset[]
}

function blankDetail(): PdpDetail {
  return { id: makeSectionId('detail'), title: '', description: '', image: '' }
}

/**
 * Structured "forged details" editor: each row is a titled detail with an
 * optional description and card image (via the media library). Rows add /
 * delete / drag-reorder with the keyboard up/down fallback — same list
 * contract as {@link PdpMaterialsField} / {@link CareSelector}.
 */
export function PdpDetailsField({ details, onChange, assets }: PdpDetailsFieldProps) {
  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...details]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: details.length,
    onMove: move,
  })

  const patch = (index: number, patchValue: Partial<PdpDetail>) =>
    onChange(details.map((item, i) => (i === index ? { ...item, ...patchValue } : item)))
  const remove = (index: number) => onChange(details.filter((_, i) => i !== index))

  return (
    <div className="space-y-3">
      {details.map((detail, index) => (
        <div
          key={detail.id || index}
          {...getItemProps(index)}
          className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 data-[drag-over]:border-[var(--color-accent)]"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              {...getHandleProps(index)}
              aria-label={`Drag to reorder detail ${index + 1}`}
              className="focus-ring inline-flex cursor-grab items-center gap-1.5 rounded px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] active:cursor-grabbing"
            >
              <ArrowDownUp size={ICON_SIZE.sm} aria-hidden="true" />
              Detail {index + 1}
            </button>
            <div className="flex items-center gap-1">
              <IconButton
                type="button"
                size="sm"
                aria-label={`Move detail ${index + 1} up`}
                disabled={index === 0}
                onClick={() => moveUp(index)}
              >
                <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                aria-label={`Move detail ${index + 1} down`}
                disabled={index === details.length - 1}
                onClick={() => moveDown(index)}
              >
                <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                size="sm"
                aria-label={`Remove detail ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
            </div>
          </div>

          <FormField label="Title" labelStyle="micro">
            <Input
              density="compact"
              placeholder="e.g. Reinforced flatlock seams"
              value={detail.title}
              onChange={(e) => patch(index, { title: e.target.value })}
              aria-label={`Detail ${index + 1} title`}
            />
          </FormField>

          <FormField label="Description" hint="Optional supporting copy." labelStyle="micro">
            <Textarea
              rows={2}
              value={detail.description}
              onChange={(e) => patch(index, { description: e.target.value })}
              aria-label={`Detail ${index + 1} description`}
            />
          </FormField>

          <MediaLibrarySlotField
            label="Image (optional)"
            kind="image"
            assets={assets}
            mediaId={detail.image}
            onMediaIdChange={(id) => patch(index, { image: id })}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        density="compact"
        onClick={() => onChange([...details, blankDetail()])}
      >
        <Plus size={ICON_SIZE.sm} aria-hidden="true" />
        Add detail
      </Button>
    </div>
  )
}
