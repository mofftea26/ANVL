import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Copy, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { adminFieldControlFineClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'
import {
  filterMediaAssets,
  mediaAssetPublicUrl,
} from './mediaAssets.service'
import type { CmsMediaAsset } from './mediaAssets.types'
import { useMediaAssetsMutations } from './useMediaAssetsQuery'

const VIRTUALIZE_THRESHOLD = 100
const ROW_GAP = 12

type MediaAssetGridProps = {
  assets: CmsMediaAsset[]
  search: string
  mimeFilter: string | null
  columns?: number
}

function MediaAssetCard({
  asset,
  onDelete,
}: {
  asset: CmsMediaAsset
  onDelete: (asset: CmsMediaAsset) => void
}) {
  const { updateAltMutation } = useMediaAssetsMutations()
  const [altDraft, setAltDraft] = useState(asset.alt)
  const publicUrl = mediaAssetPublicUrl(asset)
  const safeUrl =
    publicUrl && isLikelySafeMediaSrc(publicUrl) ? publicUrl : null
  const isVideo = asset.mime.startsWith('video/')

  const commitAlt = () => {
    const next = altDraft.trim()
    if (next === asset.alt) return
    void updateAltMutation.mutateAsync({ id: asset.id, alt: next }).then((r) => {
      if (!r.ok) toast.error(r.error)
    })
  }

  const copyUrl = async () => {
    if (!publicUrl) {
      toast.error('No public URL for this asset.')
      return
    }
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast.success('URL copied.')
    } catch {
      toast.error('Could not copy URL.')
    }
  }

  const download = async () => {
    if (!publicUrl) {
      toast.error('No public URL for this asset.')
      return
    }
    // Fetch → blob → object URL so the original filename is preserved even for
    // cross-origin storage URLs (where the anchor `download` attr is ignored).
    try {
      const res = await fetch(publicUrl)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = asset.filename || 'asset'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      // Fallback: open in a new tab so the user can save manually.
      window.open(publicUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="flex aspect-[4/3] items-center justify-center bg-[var(--color-bg)]/60 p-2">
        {safeUrl && !isVideo ? (
          <img
            src={safeUrl}
            alt={asset.alt || asset.filename}
            className="max-h-full max-w-full object-contain"
          />
        ) : safeUrl && isVideo ? (
          <video
            src={safeUrl}
            className="max-h-full max-w-full object-contain"
            muted
            playsInline
          />
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            No preview
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <p
          className="truncate text-xs font-medium text-[var(--color-text)]"
          title={asset.filename}
        >
          {asset.filename}
        </p>
        <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
          Alt text
          <input
            type="text"
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            onBlur={commitAlt}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            className={cn('mt-1 w-full', adminFieldControlFineClass)}
          />
        </label>
        <div className="flex flex-wrap gap-1">
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void copyUrl()}
            aria-label={`Copy URL for ${asset.filename}`}
          >
            <Copy size={14} className="mr-1" aria-hidden="true" />
            Copy URL
          </AdminButton>
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void download()}
            aria-label={`Download ${asset.filename}`}
          >
            <Download size={14} className="mr-1" aria-hidden="true" />
            Download
          </AdminButton>
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(asset)}
            aria-label={`Delete ${asset.filename}`}
          >
            <Trash2 size={14} className="mr-1" aria-hidden="true" />
            Delete
          </AdminButton>
        </div>
      </div>
    </article>
  )
}

export function MediaAssetGrid({
  assets,
  search,
  mimeFilter,
  columns = 3,
}: MediaAssetGridProps) {
  const filtered = useMemo(
    () => filterMediaAssets(assets, search, mimeFilter),
    [assets, search, mimeFilter],
  )
  const parentRef = useRef<HTMLDivElement>(null)
  const [pendingDelete, setPendingDelete] = useState<CmsMediaAsset | null>(null)
  const { deleteMutation } = useMediaAssetsMutations()

  const useVirtual = filtered.length > VIRTUALIZE_THRESHOLD
  const rowCount = useVirtual
    ? Math.ceil(filtered.length / columns)
    : 0

  const virtualizer = useVirtualizer({
    count: useVirtual ? rowCount : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280 + ROW_GAP,
    overscan: 2,
    enabled: useVirtual,
  })

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const result = await deleteMutation.mutateAsync(pendingDelete)
    if (result.ok) {
      toast.success('Asset deleted.')
      setPendingDelete(null)
    } else {
      toast.error(result.error)
    }
  }

  if (!filtered.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
        No assets match your filters.
      </p>
    )
  }

  if (!useVirtual) {
    return (
      <>
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="media-asset-grid"
        >
          {filtered.map((asset) => (
            <MediaAssetCard
              key={asset.id}
              asset={asset}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
        <AdminConfirmDialog
          open={pendingDelete != null}
          onClose={() => setPendingDelete(null)}
          title="Delete asset?"
          confirmLabel="Delete"
          confirmVariant="destructive"
          confirmLoading={deleteMutation.isPending}
          onConfirm={() => void confirmDelete()}
        >
          This removes the file from storage and the catalog. Links using this URL
          will break.
        </AdminConfirmDialog>
      </>
    )
  }

  return (
    <>
      <div
        ref={parentRef}
        className="max-h-[min(70vh,720px)] overflow-auto"
        data-testid="media-asset-grid-virtual"
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const start = virtualRow.index * columns
            const rowAssets = filtered.slice(start, start + columns)
            return (
              <div
                key={virtualRow.key}
                className="absolute left-0 top-0 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3"
                style={{
                  height: virtualRow.size - ROW_GAP,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {rowAssets.map((asset) => (
                  <MediaAssetCard
                    key={asset.id}
                    asset={asset}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
      <AdminConfirmDialog
        open={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        title="Delete asset?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        confirmLoading={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
      >
        This removes the file from storage and the catalog. Links using this URL
        will break.
      </AdminConfirmDialog>
    </>
  )
}
