import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Image as ImageIcon, ListOrdered, Save } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { cn } from '@/shared/lib/cn'
import { TechpackDocumentView } from './TechpackDocumentView'
import { TechpackImagesGrid } from './TechpackImagesGrid'
import { TechpackSeverityPill } from './techpackDisplay'
import { TECHPACK_STATUSES, type TechpackStatus } from './techpacks.service'
import {
  useTechpackImageUrlsQuery,
  useTechpackImagesQuery,
  useTechpackQuery,
  useUpdateTechpackMutation,
} from './useTechpacks'

/**
 * Review surface for one parsed pack: the issue queue first (it is the reason
 * this screen exists), then the document as read, then the extracted images
 * behind the promotion gate.
 *
 * There is no blueprint-verification view any more. It existed to check that
 * the parsed markers landed on the seams they described — on a crop of the
 * supplier's drawing that the passport no longer shows. The blueprint's
 * feature list is on the Review tab, which is the part that ships.
 */

type DetailTab = 'review' | 'images'

const TABS: Array<{ key: DetailTab; label: string; icon: typeof ListOrdered }> = [
  { key: 'review', label: 'Review', icon: ListOrdered },
  { key: 'images', label: 'Images', icon: ImageIcon },
]

interface TechpackDetailPanelProps {
  techpackId: string
  productOptions: ReadonlyArray<{ value: string; label: string }>
}

export function TechpackDetailPanel({ techpackId, productOptions }: TechpackDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('review')
  const [title, setTitle] = useState('')
  const [productSlug, setProductSlug] = useState('')
  const [status, setStatus] = useState<TechpackStatus>('draft')
  const [notes, setNotes] = useState('')

  const detail = useTechpackQuery(techpackId)
  const imagesQuery = useTechpackImagesQuery(techpackId)
  const images = imagesQuery.data ?? []
  const urlsQuery = useTechpackImageUrlsQuery(techpackId, images)
  const urls = urlsQuery.data ?? {}
  const update = useUpdateTechpackMutation()

  const pack = detail.data

  /**
   * Seed the form during render, keyed on the row's identity + its last write
   * — NOT in an effect on `detail.data`. React Query hands back a new object
   * on every refetch, so an effect keyed on it would wipe an operator's
   * unsaved edits the moment the window regained focus.
   */
  const seedKey = pack ? `${pack.id}:${pack.updatedAt ?? ''}` : ''
  const [seededKey, setSeededKey] = useState('')
  if (pack && seedKey !== seededKey) {
    setSeededKey(seedKey)
    setTitle(pack.title)
    setProductSlug(pack.productSlug)
    setStatus(pack.status)
    setNotes(pack.notes)
  }

  if (detail.isLoading) return <AdminLoadingState message="Loading techpack…" />
  if (detail.isError || !pack) {
    return (
      <AdminCard title="Techpack">
        <p className="text-sm text-[var(--color-text-muted)]">
          {detail.error instanceof Error ? detail.error.message : 'Could not load that techpack.'}
        </p>
      </AdminCard>
    )
  }

  const save = () => {
    update.mutate(
      {
        id: techpackId,
        title,
        productSlug,
        status,
        notes,
        // Carried as a mutation VARIABLE, not fired from an `onSuccess`
        // callback here: React Query drops the observer-level callbacks the
        // moment this panel unmounts, so an import wired there vanished
        // whenever an operator navigated away mid-save. `useTechpacks` runs it
        // from the mutation-level callback instead, which survives.
        //
        // The slugs are captured NOW, before the mutation: once it succeeds the
        // row refetches and `pack.productSlug` becomes the new value, so there
        // would be nothing left to compare against and every save would look
        // like a fresh assignment.
        autoImport: {
          previousSlug: pack.productSlug,
          nextSlug: productSlug,
          status,
          document: pack.document,
        },
      },
      {
        onSuccess: () => toast.success('Techpack saved.'),
        onError: (error: Error) => toast.error(error.message),
      },
    )
  }

  const issues = pack.document.issues
  const errors = issues.filter((issue) => issue.severity === 'error')

  return (
    <div className="space-y-6">
      <AdminCard
        title="Techpack details"
        description="Assign the product this pack describes — saving a new assignment fills that product's empty passport, size-guide and PDP fields from the pack. Anything already written is left alone; use Import from techpack in the editors to overwrite. Then work the issue list below before marking it final."
        actions={
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            loading={update.isPending}
            onClick={save}
          >
            <Save size={15} aria-hidden="true" />
            Save
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Title" labelStyle="stacked">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              density="compact"
              aria-label="Techpack title"
            />
          </FormField>
          <AdminFieldSelect
            label="Product"
            value={productSlug}
            onChange={setProductSlug}
            options={[{ value: '', label: 'Unassigned' }, ...productOptions]}
            placeholder="Unassigned"
          />
          <AdminFieldSelect
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as TechpackStatus)}
            options={TECHPACK_STATUSES.map((value) => ({
              value,
              label: value[0].toUpperCase() + value.slice(1),
            }))}
          />
          <div className="sm:col-span-2">
            <FormField label="Notes" labelStyle="stacked">
              <Textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                density="compact"
                aria-label="Techpack notes"
              />
            </FormField>
          </div>
        </div>
        <p className="anvl-micro mt-3 text-[var(--color-text-muted)]">
          Parsed by {pack.parserVersion || 'unknown parser'} · schema v{pack.schemaVersion} ·{' '}
          {pack.pageCount} pages · {images.length} images stored
        </p>
      </AdminCard>

      <AdminCard
        title="Parse issues"
        description="What the parser could not read with confidence. Anything at error severity means the extraction is suspect — treat the whole pack as unverified until it is resolved."
      >
        {issues.length === 0 ? (
          <p className="text-sm text-[var(--color-success)]">
            No issues — every page matched a known techpack layout.
          </p>
        ) : (
          <>
            {errors.length > 0 ? (
              <p className="mb-3 flex items-start gap-2 rounded-lg border border-[color-mix(in_oklab,var(--color-danger)_45%,transparent)] p-3 text-sm text-[var(--color-danger)]">
                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span>
                  {errors.length} error{errors.length === 1 ? '' : 's'} — do not import this pack
                  until they are understood.
                </span>
              </p>
            ) : null}
            <ul className="space-y-2">
              {issues.map((issue, index) => (
                <li
                  key={`${issue.code}-${issue.path}-${index}`}
                  className="flex flex-wrap items-baseline gap-2 border-b border-[var(--color-line)]/60 pb-2 last:border-0"
                >
                  <TechpackSeverityPill severity={issue.severity} />
                  <span className="anvl-micro text-[var(--color-text-muted)]">
                    {issue.page > 0 ? `p${issue.page}` : 'doc'} · {issue.path || issue.code}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] text-[var(--color-text)]">
                    {issue.message}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>

      <AdminCard title="Extraction">
        <div
          role="tablist"
          aria-label="Techpack extraction views"
          className="mb-4 inline-flex flex-wrap gap-1 rounded-full border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)] p-1"
        >
          {TABS.map((entry) => {
            const active = entry.key === tab
            return (
              <button
                key={entry.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(entry.key)}
                className={cn(
                  'focus-ring flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors',
                  active
                    ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                <entry.icon size={15} aria-hidden="true" />
                {entry.label}
              </button>
            )
          })}
        </div>

        {tab === 'review' ? (
          <TechpackDocumentView document={pack.document} />
        ) : imagesQuery.isLoading ? (
          <AdminLoadingState message="Loading images…" />
        ) : (
          <TechpackImagesGrid
            techpackId={techpackId}
            images={images}
            urls={urls}
            productSlug={pack.productSlug}
          />
        )}
      </AdminCard>
    </div>
  )
}
