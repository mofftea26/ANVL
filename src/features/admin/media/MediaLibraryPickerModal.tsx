import { useMemo, useState } from 'react'
import type { MediaPickerKind } from '@/shared/components/ui/MediaPickerField'
import { Modal } from '@/shared/components/ui/Modal'
import { adminFieldControlClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'
import {
  filterMediaAssets,
  mediaAssetPublicUrl,
} from './mediaAssets.service'
import { useMediaAssetsQuery } from './useMediaAssetsQuery'

type MediaLibraryPickerModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (publicUrl: string) => void
  kind?: MediaPickerKind
}

function matchesKind(mime: string, kind: MediaPickerKind): boolean {
  if (kind === 'image') return mime.startsWith('image/')
  if (kind === 'video') return mime.startsWith('video/')
  return mime.startsWith('image/') || mime.startsWith('video/')
}

export function MediaLibraryPickerModal({
  open,
  onClose,
  onSelect,
  kind = 'image',
}: MediaLibraryPickerModalProps) {
  const query = useMediaAssetsQuery()
  const [search, setSearch] = useState('')

  const items = useMemo(() => {
    const base = query.data ?? []
    const filtered = filterMediaAssets(base, search, null).filter((a) =>
      matchesKind(a.mime, kind),
    )
    return filtered
  }, [query.data, search, kind])

  return (
    <Modal open={open} onClose={onClose} title="Media library">
      <div className="space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className={cn('h-9 w-full text-sm', adminFieldControlClass)}
          aria-label="Search library"
        />
        {query.isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : query.isError ? (
          <p role="alert" className="text-sm text-red-300">
            {(query.error as Error).message}
          </p>
        ) : !items.length ? (
          <p className="text-sm text-[var(--color-text-muted)]">No matching assets.</p>
        ) : (
          <ul className="grid max-h-[min(60vh,480px)] grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
            {items.map((asset) => {
              const url = mediaAssetPublicUrl(asset)
              const safe = url && isLikelySafeMediaSrc(url) ? url : null
              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] text-left transition-colors hover:border-[var(--color-accent)]"
                    onClick={() => {
                      if (url) {
                        onSelect(url)
                        onClose()
                      }
                    }}
                    disabled={!url}
                  >
                    <div className="flex aspect-square items-center justify-center bg-[var(--color-bg)]/50 p-1">
                      {safe && asset.mime.startsWith('image/') ? (
                        <img
                          src={safe}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {asset.filename}
                        </span>
                      )}
                    </div>
                    <span className="truncate px-2 py-1 text-[10px] text-[var(--color-text-muted)]">
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
