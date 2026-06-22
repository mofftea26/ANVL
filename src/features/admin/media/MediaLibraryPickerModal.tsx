import { useEffect, useMemo, useState } from 'react'
import type { MediaPickerKind } from '@/shared/components/ui/MediaPickerField'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { adminFieldControlClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'
import {
  filterMediaLibraryItems,
  mediaLibraryMimeFiltersForKind,
  type MediaLibraryMimeFilter,
  type MediaLibraryPick,
} from './filterMediaLibraryItems'
import { mediaAssetPublicUrl } from './mediaAssets.service'
import { useMediaAssetsQuery } from './useMediaAssetsQuery'

export type { MediaLibraryPick } from './filterMediaLibraryItems'

type MediaLibraryPickerModalProps = {
  open: boolean
  onClose: () => void
  /** Pass `null` when the user clears selection. */
  onSelect: (pick: MediaLibraryPick | null) => void
  /** Restrict selectable assets (alias: filterTypes). */
  kind?: MediaPickerKind
  filterTypes?: MediaPickerKind
  title?: string
  allowClear?: boolean
  selectedMediaId?: string | null
}

function toPick(asset: { id: string; filename: string }, publicUrl: string): MediaLibraryPick {
  return { id: asset.id, publicUrl, filename: asset.filename }
}

export function MediaLibraryPickerModal({
  open,
  onClose,
  onSelect,
  kind: kindProp = 'any',
  filterTypes,
  title = 'Media library',
  allowClear = false,
  selectedMediaId,
}: MediaLibraryPickerModalProps) {
  const kind = filterTypes ?? kindProp
  const query = useMediaAssetsQuery()
  const [search, setSearch] = useState('')
  const [mimeFilter, setMimeFilter] = useState<MediaLibraryMimeFilter>('all')

  const mimeFilters = useMemo(() => mediaLibraryMimeFiltersForKind(kind), [kind])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setMimeFilter('all')
      return
    }
    if (kind === 'image') setMimeFilter('image')
    else if (kind === 'video') setMimeFilter('video')
  }, [open, kind])

  const items = useMemo(() => {
    const base = query.data ?? []
    return filterMediaLibraryItems(base, search, mimeFilter, kind)
  }, [query.data, search, mimeFilter, kind])

  const handleClear = () => {
    onSelect(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename, alt, tags…"
            className={cn('w-full sm:max-w-md', adminFieldControlClass)}
            aria-label="Search library"
          />
          {mimeFilters.length > 1 ? (
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by type">
              {mimeFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setMimeFilter(filter.id)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-ring',
                    mimeFilter === filter.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text)]'
                      : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {allowClear ? (
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Clear selection
            </Button>
          </div>
        ) : null}

        {query.isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : query.isError ? (
          <p role="alert" className="text-sm text-[color:var(--color-danger)]">
            {(query.error as Error).message}
          </p>
        ) : !items.length ? (
          <p className="text-sm text-[var(--color-text-muted)]">No matching assets.</p>
        ) : (
          <ul
            className="grid max-h-[min(60vh,480px)] grid-cols-2 gap-2 overflow-auto sm:grid-cols-3"
            aria-label="Media library assets"
          >
            {items.map((asset) => {
              const url = mediaAssetPublicUrl(asset)
              const safe = url && isLikelySafeMediaSrc(url) ? url : null
              const isVideo = asset.mime.startsWith('video/')
              const isSelected = Boolean(selectedMediaId && asset.id === selectedMediaId)

              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col overflow-hidden rounded-lg border bg-[var(--color-surface)] text-left transition-colors focus-ring',
                      isSelected
                        ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/40'
                        : 'border-[var(--color-line)] hover:border-[var(--color-accent)]',
                    )}
                    aria-label={`Select ${asset.filename}`}
                    aria-pressed={isSelected}
                    onClick={() => {
                      if (url) {
                        onSelect(toPick(asset, url))
                        onClose()
                      }
                    }}
                    disabled={!url}
                  >
                    <div className="flex aspect-square items-center justify-center bg-[var(--color-bg)]/50 p-1">
                      {safe && !isVideo ? (
                        <img
                          src={safe}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : safe && isVideo ? (
                        <video
                          src={safe}
                          className="max-h-full max-w-full object-contain"
                          muted
                          playsInline
                        />
                      ) : (
                        <span className="px-1 text-center text-[10px] text-[var(--color-text-muted)]">
                          {asset.filename}
                        </span>
                      )}
                    </div>
                    <span
                      className="truncate px-2 py-1 text-[10px] text-[var(--color-text-muted)]"
                      title={asset.filename}
                    >
                      {asset.filename}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
