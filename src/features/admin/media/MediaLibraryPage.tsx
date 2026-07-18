import { useMemo, useState } from 'react'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { Input } from '@/shared/components/ui/Input'
import { cn } from '@/shared/lib/cn'
import { MediaAssetGrid } from './MediaAssetGrid'
import { MediaUploadZone } from './MediaUploadZone'
import { listPresentMediaFormats, type MediaAssignmentFilter } from './mediaAssets.service'
import { useMediaAssetsQuery } from './useMediaAssetsQuery'

const MIME_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
] as const

const ASSIGNMENT_OPTIONS: { value: MediaAssignmentFilter; label: string }[] = [
  { value: 'all', label: 'Show all' },
  { value: 'assigned', label: 'Show assigned' },
  { value: 'unassigned', label: 'Show unassigned' },
]

function formatOptionLabel(mime: string): string {
  return mime
}

type MediaLibraryPageProps = {
  /** Media ids currently assigned to any asset slot — enables the
   *  assigned/unassigned badge + filter. Omitted where no slot config is
   *  in scope (assignment UI is hidden entirely in that case). */
  assignedIds?: ReadonlySet<string>
  /** Deep-link seed for the search box (e.g. an asset's `context-slot` name). */
  initialSearch?: string
}

export function MediaLibraryPage({ assignedIds, initialSearch }: MediaLibraryPageProps) {
  const env = getSupabasePublicEnv()
  const query = useMediaAssetsQuery()
  const [search, setSearch] = useState(initialSearch ?? '')
  const [mimeFilter, setMimeFilter] = useState<string>('all')
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [assignmentFilter, setAssignmentFilter] = useState<MediaAssignmentFilter>('all')

  const formatOptions = useMemo(() => {
    const present = listPresentMediaFormats(query.data ?? [])
    return [
      { value: 'all', label: 'All formats' },
      ...present.map((mime) => ({ value: mime, label: formatOptionLabel(mime) })),
    ]
  }, [query.data])

  if (!env) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Set <code className="rounded bg-[var(--color-surface)] px-1">VITE_SUPABASE_*</code>{' '}
        to use the media library.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        Upload once, reuse URLs across drops and site settings.
      </p>

      <MediaUploadZone disabled={query.isLoading} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search filename, alt, tags…"
          density="compact"
          className="max-w-md flex-1"
          aria-label="Search media"
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by type">
          {MIME_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setMimeFilter(f.id)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                mimeFilter === f.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text)]'
                  : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminFieldSelect
          label="Format"
          value={formatFilter}
          options={formatOptions}
          onChange={setFormatFilter}
        />
        {assignedIds && (
          <AdminFieldSelect
            label="Assignment"
            value={assignmentFilter}
            options={ASSIGNMENT_OPTIONS}
            onChange={(v) => setAssignmentFilter(v as MediaAssignmentFilter)}
          />
        )}
      </div>

      {query.isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading library…</p>
      ) : query.isError ? (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          {(query.error as Error).message}
        </p>
      ) : (
        <MediaAssetGrid
          assets={query.data ?? []}
          search={search}
          mimeFilter={mimeFilter}
          formatFilter={formatFilter}
          assignmentFilter={assignmentFilter}
          assignedIds={assignedIds}
        />
      )}
    </div>
  )
}
