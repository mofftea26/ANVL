import { ImagePlus } from '@/shared/icons'
import { useMemo, useState } from 'react'
import type { MediaPickerKind } from '@/features/admin/media/mediaPickerKind.types'
import { FormField } from '@/shared/components/ui/FormField'
import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'
import { MediaLibraryPickerModal } from './MediaLibraryPickerModal'
import { hasDraggedMedia, readDraggedMediaId } from './mediaDrag'
import { mediaAssetPublicUrl } from './mediaAssets.service'
import type { CmsMediaAsset } from './mediaAssets.types'
import { ICON_SIZE } from '@/shared/lib/iconSize'

type MediaLibrarySlotFieldProps = {
  label: string
  hint?: string
  mediaId: string
  onMediaIdChange: (mediaId: string) => void
  kind?: MediaPickerKind
  assets: CmsMediaAsset[]
}

function resolveAsset(
  mediaId: string,
  assets: CmsMediaAsset[],
): CmsMediaAsset | undefined {
  const trimmed = mediaId.trim()
  if (!trimmed) return undefined
  return assets.find((asset) => asset.id === trimmed)
}

export function MediaLibrarySlotField({
  label,
  hint,
  mediaId,
  onMediaIdChange,
  kind = 'any',
  assets,
}: MediaLibrarySlotFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const assigned = useMemo(() => resolveAsset(mediaId, assets), [mediaId, assets])
  const previewUrl = assigned ? mediaAssetPublicUrl(assigned) : null
  const safePreview =
    previewUrl && isLikelySafeMediaSrc(previewUrl) ? previewUrl : null
  const isVideo = assigned?.mime.startsWith('video/') ?? false

  return (
    <FormField label={label} className="space-y-2" labelStyle="stacked">
      <div
        onDragOver={(e) => {
          if (!hasDraggedMedia(e.dataTransfer)) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!hasDraggedMedia(e.dataTransfer)) return
          e.preventDefault()
          setDragOver(false)
          const id = readDraggedMediaId(e.dataTransfer)
          if (id) onMediaIdChange(id)
        }}
        className={cn(
          'flex flex-wrap items-start gap-3 rounded-lg border bg-[var(--color-bg)]/30 p-3 transition-colors',
          dragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
            : 'border-[var(--color-line)]',
        )}
      >
        <div
          className={cn(
            'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]',
          )}
        >
          {safePreview && !isVideo ? (
            <img src={safePreview} alt="" className="max-h-full max-w-full object-contain" />
          ) : safePreview && isVideo ? (
            <video
              src={safePreview}
              className="max-h-full max-w-full object-contain"
              muted
              playsInline
            />
          ) : (
            <span className="px-1 text-center text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              Empty
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate text-xs text-[var(--color-text)]">
            {assigned ? assigned.filename : 'Not assigned'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] focus-ring"
              onClick={() => setPickerOpen(true)}
            >
              <ImagePlus size={ICON_SIZE.sm} aria-hidden="true" />
              {assigned ? 'Change' : 'Choose media'}
            </button>
            {assigned ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-ring"
                onClick={() => onMediaIdChange('')}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {hint ? (
        <p className="text-xs leading-snug text-[var(--color-text-muted)]">{hint}</p>
      ) : null}

      {pickerOpen ? (
        <MediaLibraryPickerModal
          open
          onClose={() => setPickerOpen(false)}
          kind={kind}
          allowClear
          selectedMediaId={mediaId || null}
          title={`Choose media — ${label}`}
          onSelect={(pick) => {
            onMediaIdChange(pick?.id ?? '')
            setPickerOpen(false)
          }}
        />
      ) : null}
    </FormField>
  )
}
