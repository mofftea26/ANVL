import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Copy, Download, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/Button'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { adminFieldControlFineClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'
import {
  filterMediaAssets,
  mediaAssetPublicUrl,
  type MediaAssignmentFilter,
} from './mediaAssets.service'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import type { CmsMediaAsset } from './mediaAssets.types'
import { useMediaAssetsMutations } from './useMediaAssetsQuery'

const VIRTUALIZE_THRESHOLD = 100
const ROW_GAP = 12

const GlbAssetPreview = lazy(() =>
  import('./GlbAssetPreview').then((m) => ({ default: m.GlbAssetPreview })),
)

function isModelMime(mime: string): boolean {
  return mime.startsWith('model/') || mime.includes('gltf')
}

async function downloadAsset(asset: CmsMediaAsset): Promise<boolean> {
  const publicUrl = mediaAssetPublicUrl(asset)
  if (!publicUrl) return false
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
    return true
  } catch {
    window.open(publicUrl, '_blank', 'noopener,noreferrer')
    return true
  }
}

type MediaAssetGridProps = {
  assets: CmsMediaAsset[]
  search: string
  mimeFilter: string | null
  formatFilter?: string | null
  assignmentFilter?: MediaAssignmentFilter
  assignedIds?: ReadonlySet<string>
  columns?: number
}

function MediaAssetCard({
  asset,
  assigned,
  selected,
  onToggleSelected,
  onDelete,
}: {
  asset: CmsMediaAsset
  assigned: boolean | null
  selected: boolean
  onToggleSelected: (id: string) => void
  onDelete: (asset: CmsMediaAsset) => void
}) {
  const { updateAltMutation, renameMutation } = useMediaAssetsMutations()
  const [altDraft, setAltDraft] = useState(asset.alt)
  const [filenameDraft, setFilenameDraft] = useState(asset.filename)
  const publicUrl = mediaAssetPublicUrl(asset)
  const safeUrl =
    publicUrl && isLikelySafeMediaSrc(publicUrl) ? publicUrl : null
  const isVideo = asset.mime.startsWith('video/')
  const isModel = isModelMime(asset.mime)

  const commitAlt = () => {
    const next = altDraft.trim()
    if (next === asset.alt) return
    void updateAltMutation.mutateAsync({ id: asset.id, alt: next }).then((r) => {
      if (!r.ok) toast.error(r.error)
    })
  }

  const commitFilename = () => {
    const next = filenameDraft.trim()
    if (!next) {
      setFilenameDraft(asset.filename)
      return
    }
    if (next === asset.filename) return
    void renameMutation
      .mutateAsync({ id: asset.id, filename: next })
      .then((r) => {
        if (!r.ok) {
          toast.error(r.error)
          setFilenameDraft(asset.filename)
        } else {
          toast.success('Renamed.')
        }
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
    await downloadAsset(asset)
  }

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-[var(--color-surface)]',
        selected ? 'border-[var(--color-accent)]' : 'border-[var(--color-line)]',
      )}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[var(--color-bg)]/60 p-2">
        <label className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border border-[var(--color-line)] bg-[var(--color-surface)]/90">
          <span className="sr-only">Select {asset.filename}</span>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected(asset.id)}
            className="h-4 w-4"
          />
        </label>
        {assigned != null && (
          <span
            className={cn(
              'absolute right-2 top-2 z-10 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
              assigned
                ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                : 'bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)]',
            )}
          >
            {assigned ? 'Assigned' : 'Unassigned'}
          </span>
        )}
        {safeUrl && isModel ? (
          <Suspense
            fallback={
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                Loading 3D…
              </span>
            }
          >
            <GlbAssetPreview url={safeUrl} />
          </Suspense>
        ) : safeUrl && !isVideo ? (
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
        <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
          Filename
          <span className="mt-1 flex items-center gap-1">
            <input
              type="text"
              value={filenameDraft}
              onChange={(e) => setFilenameDraft(e.target.value)}
              onBlur={commitFilename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
              title={asset.filename}
              className={cn('w-full', adminFieldControlFineClass)}
            />
            <Pencil
              size={ICON_SIZE.sm}
              aria-hidden="true"
              className="shrink-0 text-[var(--color-text-muted)]"
            />
          </span>
        </label>
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            onClick={() => void copyUrl()}
            aria-label={`Copy URL for ${asset.filename}`}
          >
            <Copy size={ICON_SIZE.sm} className="mr-1" aria-hidden="true" />
            Copy URL
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            onClick={() => void download()}
            aria-label={`Download ${asset.filename}`}
          >
            <Download size={ICON_SIZE.sm} className="mr-1" aria-hidden="true" />
            Download
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            onClick={() => onDelete(asset)}
            aria-label={`Delete ${asset.filename}`}
          >
            <Trash2 size={ICON_SIZE.sm} className="mr-1" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>
    </article>
  )
}

export function MediaAssetGrid({
  assets,
  search,
  mimeFilter,
  formatFilter = null,
  assignmentFilter = 'all',
  assignedIds,
  columns = 3,
}: MediaAssetGridProps) {
  const filtered = useMemo(
    () =>
      filterMediaAssets(assets, search, mimeFilter, {
        formatFilter,
        assignmentFilter,
        assignedIds,
      }),
    [assets, search, mimeFilter, formatFilter, assignmentFilter, assignedIds],
  )
  const parentRef = useRef<HTMLDivElement>(null)
  const [pendingDelete, setPendingDelete] = useState<CmsMediaAsset | null>(null)
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { deleteMutation, bulkDeleteMutation } = useMediaAssetsMutations()

  const filteredIds = useMemo(() => new Set(filtered.map((a) => a.id)), [filtered])
  const selectedAssets = useMemo(
    () => filtered.filter((a) => selectedIds.has(a.id)),
    [filtered, selectedIds],
  )

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id))

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev)
        for (const id of filteredIds) next.delete(id)
        return next
      }
      return new Set([...prev, ...filteredIds])
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const downloadSelected = async () => {
    for (const asset of selectedAssets) {
      // Sequential to avoid triggering the browser's multi-download popup blocker.
      // eslint-disable-next-line no-await-in-loop -- intentional serial downloads
      await downloadAsset(asset)
    }
    toast.success(`Downloading ${selectedAssets.length} asset(s).`)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const result = await deleteMutation.mutateAsync(pendingDelete)
    if (result.ok) {
      toast.success('Asset deleted.')
      setPendingDelete(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(pendingDelete.id)
        return next
      })
    } else {
      toast.error(result.error)
    }
  }

  const confirmBulkDelete = async () => {
    const result = await bulkDeleteMutation.mutateAsync(selectedAssets)
    setPendingBulkDelete(false)
    if (result.failures.length === 0) {
      toast.success(`Deleted ${result.deleted} asset(s).`)
    } else {
      toast.error(
        `Deleted ${result.deleted}, failed ${result.failures.length}: ${result.failures[0]?.error}`,
      )
    }
    clearSelection()
  }

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

  const bulkToolbar = (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs">
      <label className="flex items-center gap-2 font-medium text-[var(--color-text)]">
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={toggleSelectAll}
          aria-label="Select all visible assets"
        />
        {selectedIds.size > 0
          ? `${selectedIds.size} selected`
          : `Select all (${filtered.length})`}
      </label>
      {selectedIds.size > 0 && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            onClick={() => void downloadSelected()}
          >
            <Download size={ICON_SIZE.sm} className="mr-1" aria-hidden="true" />
            Download selected
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            onClick={() => setPendingBulkDelete(true)}
          >
            <Trash2 size={ICON_SIZE.sm} className="mr-1" aria-hidden="true" />
            Delete selected
          </Button>
          <Button type="button" variant="ghost" size="sm" density="compact" onClick={clearSelection}>
            Clear
          </Button>
        </>
      )}
    </div>
  )

  if (!filtered.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
        No assets match your filters.
      </p>
    )
  }

  const assignedFor = (id: string): boolean | null =>
    assignedIds ? assignedIds.has(id) : null

  if (!useVirtual) {
    return (
      <>
        {bulkToolbar}
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="media-asset-grid"
        >
          {filtered.map((asset) => (
            <MediaAssetCard
              key={asset.id}
              asset={asset}
              assigned={assignedFor(asset.id)}
              selected={selectedIds.has(asset.id)}
              onToggleSelected={toggleSelected}
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
        <AdminConfirmDialog
          open={pendingBulkDelete}
          onClose={() => setPendingBulkDelete(false)}
          title={`Delete ${selectedAssets.length} asset(s)?`}
          confirmLabel="Delete all"
          confirmVariant="destructive"
          confirmLoading={bulkDeleteMutation.isPending}
          onConfirm={() => void confirmBulkDelete()}
        >
          This removes the selected files from storage and the catalog. Links using
          these URLs will break.
        </AdminConfirmDialog>
      </>
    )
  }

  return (
    <>
      {bulkToolbar}
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
                    assigned={assignedFor(asset.id)}
                    selected={selectedIds.has(asset.id)}
                    onToggleSelected={toggleSelected}
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
      <AdminConfirmDialog
        open={pendingBulkDelete}
        onClose={() => setPendingBulkDelete(false)}
        title={`Delete ${selectedAssets.length} asset(s)?`}
        confirmLabel="Delete all"
        confirmVariant="destructive"
        confirmLoading={bulkDeleteMutation.isPending}
        onConfirm={() => void confirmBulkDelete()}
      >
        This removes the selected files from storage and the catalog. Links using
        these URLs will break.
      </AdminConfirmDialog>
    </>
  )
}
