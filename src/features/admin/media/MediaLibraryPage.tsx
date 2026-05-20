import { useState } from 'react'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { adminFieldControlClass } from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'
import { MediaAssetGrid } from './MediaAssetGrid'
import { MediaUploadZone } from './MediaUploadZone'
import { useMediaAssetsQuery } from './useMediaAssetsQuery'

const MIME_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
] as const

export function MediaLibraryPage() {
  const env = getSupabasePublicEnv()
  const query = useMediaAssetsQuery()
  const [search, setSearch] = useState('')
  const [mimeFilter, setMimeFilter] = useState<string>('all')

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
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search filename, alt, tags…"
          className={cn('max-w-md flex-1', adminFieldControlClass)}
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

      {query.isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading library…</p>
      ) : query.isError ? (
        <p role="alert" className="text-sm text-red-300">
          {(query.error as Error).message}
        </p>
      ) : (
        <MediaAssetGrid
          assets={query.data ?? []}
          search={search}
          mimeFilter={mimeFilter}
        />
      )}
    </div>
  )
}
