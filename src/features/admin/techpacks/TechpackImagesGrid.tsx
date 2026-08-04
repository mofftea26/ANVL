import { useState } from 'react'
import { toast } from 'sonner'
import { BadgeCheck, Image as ImageIcon, Trash2, Upload } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import type { TechpackImageRow } from './techpackFiles.service'
import { describeBulkOutcome } from './techpackImageBulk'
import {
  useBulkTechpackImagesMutation,
  useDeleteTechpackImageMutation,
  usePromoteTechpackImageMutation,
} from './useTechpacks'

/**
 * Every image the parser lifted out of the PDF, and the ONE control that lets
 * a pixel leave the private bucket.
 *
 * Promotion is deliberately slow: the confirm shows the image FULL SIZE first,
 * because the text-stripping gates cannot see into a bitmap. A supplier
 * watermark, a factory annotation or a vendor logo baked into the artwork
 * survives every regex in `parse/strip.ts` and would ship to the storefront
 * with the asset. The only defence is a human looking at it.
 */

interface TechpackImagesGridProps {
  techpackId: string
  images: readonly TechpackImageRow[]
  urls: Readonly<Record<string, string>>
  productSlug: string
}

function roleLabel(role: string): string {
  return role.replace(/-/g, ' ')
}

export function TechpackImagesGrid({
  techpackId,
  images,
  urls,
  productSlug,
}: TechpackImagesGridProps) {
  /** Both actions confirm, so they share one target rather than two states. */
  const [candidate, setCandidate] = useState<{
    image: TechpackImageRow
    kind: 'promote' | 'delete'
  } | null>(null)
  /** Ids, not rows: the grid refetches after every action and rows are replaced. */
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [bulkKind, setBulkKind] = useState<'promote' | 'delete' | null>(null)
  const promote = usePromoteTechpackImageMutation(techpackId)
  const remove = useDeleteTechpackImageMutation(techpackId)
  const bulk = useBulkTechpackImagesMutation(techpackId)
  const busyId =
    promote.isPending || remove.isPending ? (candidate?.image.id ?? null) : null

  // Only unpromoted images can be acted on in bulk, so the whole selection
  // model ignores promoted ones rather than letting an operator pick something
  // every action would then skip.
  const selectable = images.filter((image) => !image.promotedMediaId)
  const selected = selectable.filter((image) => selectedIds.has(image.id))
  const allSelected = selectable.length > 0 && selected.length === selectable.length

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const runBulk = () => {
    if (!bulkKind || selected.length === 0) return
    const kind = bulkKind
    bulk.mutate(
      { images: selected, kind, productSlug },
      {
        onSuccess: (outcome) => {
          toast.success(
            describeBulkOutcome(outcome, kind === 'promote' ? 'published' : 'deleted'),
          )
          setSelectedIds(new Set())
          setBulkKind(null)
        },
        onError: (error: Error) => toast.error(error.message),
      },
    )
  }

  if (images.length === 0) {
    return (
      <p className="py-6 text-sm text-[var(--color-text-muted)]">
        No images were extracted from this pack. Sizing, colorways, construction and care are
        unaffected — image extraction is optional by design.
      </p>
    )
  }

  const confirmPromote = () => {
    if (!candidate) return
    if (candidate.kind === 'delete') {
      remove.mutate(candidate.image, {
        onSuccess: () => {
          toast.success('Image removed from this techpack.')
          setCandidate(null)
        },
        onError: (error: Error) => toast.error(error.message),
      })
      return
    }
    const stem = productSlug || 'techpack'
    promote.mutate(
      { image: candidate.image, filename: `${stem}-${candidate.image.refId}.webp` },
      {
        onSuccess: () => {
          toast.success('Published to the media library.')
          setCandidate(null)
        },
        onError: (error: Error) => toast.error(error.message),
      },
    )
  }

  const candidateUrl = candidate ? urls[candidate.image.storagePath] : undefined
  const deleting = candidate?.kind === 'delete'
  const busy = promote.isPending || remove.isPending

  return (
    <>
      {selectable.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface-elevated)_35%,transparent)] px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={allSelected}
              // Indeterminate is a DOM property, not an attribute — it cannot
              // be set in JSX, so it is written on the node directly.
              ref={(node) => {
                if (node) node.indeterminate = selected.length > 0 && !allSelected
              }}
              onChange={() =>
                setSelectedIds(
                  allSelected ? new Set() : new Set(selectable.map((image) => image.id)),
                )
              }
              aria-label="Select all images that are not yet in the media library"
            />
            <span className="text-[var(--color-text-muted)]">
              {selected.length > 0
                ? `${selected.length} selected`
                : `Select all (${selectable.length})`}
            </span>
          </label>

          {selected.length > 0 ? (
            <span className="ml-auto flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                density="compact"
                disabled={bulk.isPending}
                onClick={() => setBulkKind('promote')}
              >
                <Upload size={14} aria-hidden="true" />
                Promote {selected.length}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                density="compact"
                disabled={bulk.isPending}
                onClick={() => setBulkKind('delete')}
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete {selected.length}
              </Button>
            </span>
          ) : null}
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => {
          const url = urls[image.storagePath]
          const promoted = Boolean(image.promotedMediaId)
          const checked = selectedIds.has(image.id)
          return (
            <li
              key={image.id}
              className={cn(
                'overflow-hidden rounded-xl border bg-[var(--color-surface)] transition-colors',
                checked && !promoted
                  ? 'border-[color-mix(in_oklab,var(--color-accent)_55%,transparent)]'
                  : 'border-[var(--color-line)]',
              )}
            >
              <div className="relative grid aspect-square place-items-center bg-[color-mix(in_oklab,var(--color-surface-elevated)_40%,transparent)] p-2">
                {promoted ? null : (
                  <label className="absolute left-1.5 top-1.5 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] backdrop-blur-sm">
                    <Checkbox
                      checked={checked}
                      onChange={() => toggle(image.id)}
                      aria-label={`Select ${roleLabel(image.role)} from page ${image.page}`}
                    />
                  </label>
                )}
                {url ? (
                  <img
                    src={url}
                    alt={`${roleLabel(image.role)} from page ${image.page}`}
                    width={image.width ?? undefined}
                    height={image.height ?? undefined}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ImageIcon size={22} aria-hidden="true" className="text-[var(--color-text-muted)]" />
                )}
              </div>
              <div className="space-y-2 p-2.5">
                <p className="anvl-micro truncate text-[var(--color-text-muted)]">
                  p{image.page} · {roleLabel(image.role)}
                  {image.width && image.height ? ` · ${image.width}×${image.height}` : ''}
                </p>
                {promoted ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-[var(--color-success)]">
                    <BadgeCheck size={14} aria-hidden="true" />
                    In media library
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      density="compact"
                      className="flex-1"
                      disabled={!url || busyId === image.id}
                      onClick={() => setCandidate({ image, kind: 'promote' })}
                    >
                      <Upload size={14} aria-hidden="true" />
                      Promote
                    </Button>
                    {/* A pack yields dozens of images and most are page
                        furniture. Without a way to clear them the operator
                        reviews the same noise on every visit. Promoted images
                        show no delete: their public copy may already be in use,
                        so that has to be unpublished from the library first. */}
                    <IconButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${roleLabel(image.role)} from page ${image.page}`}
                      disabled={busyId === image.id}
                      onClick={() => setCandidate({ image, kind: 'delete' })}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </IconButton>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <Modal
        open={candidate !== null}
        onClose={() => setCandidate(null)}
        title={deleting ? 'Delete this extracted image?' : 'Publish this image to the media library?'}
        className="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid max-h-[52vh] place-items-center overflow-auto rounded-lg border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface-elevated)_40%,transparent)] p-3">
            {candidateUrl ? (
              <img
                src={candidateUrl}
                alt={
                  candidate
                    ? `Full size ${roleLabel(candidate.image.role)} from page ${candidate.image.page}`
                    : ''
                }
                className="max-w-full"
              />
            ) : null}
          </div>
          <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
            {deleting ? (
              <>
                <p className="text-[var(--color-text)]">
                  This removes the image from the techpack and deletes its file.
                </p>
                <p>
                  Nothing published depends on it — an image only reaches the storefront by
                  being promoted, and a promoted one cannot be deleted here. Re-parsing the
                  pack would bring it back.
                </p>
              </>
            ) : (
              <>
                <p className="text-[var(--color-text)]">
                  Look at the pixels before you publish.
                </p>
                <p>
                  Supplier stripping only reads TEXT. A watermark, a factory annotation, a
                  vendor logo or a style code drawn INTO this bitmap survives every filter and
                  would ship to the storefront with the asset. Zoom in on the corners and edges.
                </p>
                <p>
                  Publishing copies it into the public <code>cms-media</code> library, where it
                  becomes a normal asset any slot can use. Print artwork is reproducible IP —
                  hold it back unless you mean to show it.
                </p>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              density="compact"
              disabled={busy}
              onClick={() => setCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={deleting ? 'destructive' : 'primary'}
              size="sm"
              density="compact"
              loading={busy}
              onClick={confirmPromote}
              className={cn(!deleting && !candidateUrl && 'pointer-events-none opacity-60')}
            >
              {deleting ? 'Delete image' : 'I have checked it — publish'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={bulkKind !== null}
        onClose={() => setBulkKind(null)}
        title={
          bulkKind === 'delete'
            ? `Delete ${selected.length} image${selected.length === 1 ? '' : 's'}?`
            : `Publish ${selected.length} image${selected.length === 1 ? '' : 's'}?`
        }
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Thumbnails, not just a count. "Publish 14 images" is a number an
              operator cannot check; the strip is what makes it a decision. */}
          <ul className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {selected.map((image) => {
              const url = urls[image.storagePath]
              return (
                <li
                  key={image.id}
                  className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface-elevated)_40%,transparent)]"
                >
                  {url ? (
                    <img
                      src={url}
                      alt={`${roleLabel(image.role)} from page ${image.page}`}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={16} aria-hidden="true" className="text-[var(--color-text-muted)]" />
                  )}
                </li>
              )
            })}
          </ul>

          <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
            {bulkKind === 'delete' ? (
              <p>
                This removes them from the techpack and deletes their files. Nothing published
                depends on them, and re-parsing the pack would bring them back.
              </p>
            ) : (
              <>
                <p className="text-[var(--color-text)]">
                  Bulk publishing skips the full-size check.
                </p>
                <p>
                  Supplier stripping only reads TEXT — a watermark, factory annotation or vendor
                  logo drawn INTO a bitmap survives every filter and ships with the asset. Only
                  do this for images you have already looked at closely. Publish one at a time
                  if you have not.
                </p>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              density="compact"
              disabled={bulk.isPending}
              onClick={() => setBulkKind(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={bulkKind === 'delete' ? 'destructive' : 'primary'}
              size="sm"
              density="compact"
              loading={bulk.isPending}
              onClick={runBulk}
            >
              {bulkKind === 'delete'
                ? `Delete ${selected.length}`
                : `Publish ${selected.length}`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
