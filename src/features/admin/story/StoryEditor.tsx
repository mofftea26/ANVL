import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import {
  formatChapterNumber,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'
import { DEFAULT_BOOK_COLORS, EMPTY_STORY_ASSET } from '@/features/story/schemas/story.schema'
import { listSaga, upsertChapter } from '@/features/admin/story/story.service'
import { ChapterForm } from '@/features/admin/story/ChapterForm'
import { ActListEditor } from '@/features/admin/story/ActListEditor'
import { CastListEditor } from '@/features/admin/story/CastListEditor'
import { cn } from '@/shared/lib/cn'

/** Admin editor for the Story saga: chapters → acts → cast, backed by Supabase. */
export function StoryEditor() {
  const [chapters, setChapters] = useState<StoryChapter[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const reload = useCallback(async () => {
    const res = await listSaga()
    if (!res.ok) {
      setError(res.error)
      setChapters([])
      return
    }
    setError(null)
    setChapters(res.data)
    setSelectedId((prev) =>
      prev && res.data.some((c) => c.id === prev) ? prev : (res.data[0]?.id ?? null),
    )
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await reload()
      setLoading(false)
    })()
  }, [reload])

  async function createChapter() {
    setCreating(true)
    try {
      const next = chapters.length + 1
      const res = await upsertChapter({
        slug: `chapter-${next}-${Date.now().toString(36)}`,
        chapterNumber: next,
        title: `Chapter ${next}`,
        subtitle: `Drop ${formatChapterNumber(next)}`,
        description: '',
        cover: EMPTY_STORY_ASSET,
        coverLogo: EMPTY_STORY_ASSET,
        colors: DEFAULT_BOOK_COLORS,
        sortOrder: next,
        isPublished: false,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      await reload()
      setSelectedId(res.data)
    } finally {
      setCreating(false)
    }
  }

  const selected = chapters.find((c) => c.id === selectedId) ?? null

  if (loading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading the saga…</p>
  }
  if (error) {
    return <p className="text-sm text-red-300">{error}</p>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]" data-testid="story-editor">
      {/* Chapter list */}
      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="anvl-heading text-lg font-normal">Chapters</h2>
          <AdminButton type="button" variant="secondary" size="sm" loading={creating} icon={<Plus size={14} />} onClick={() => void createChapter()}>
            New
          </AdminButton>
        </div>
        {chapters.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No chapters yet. Create the first one.</p>
        ) : (
          <ul className="space-y-2">
            {chapters.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'focus-ring flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors',
                    c.id === selectedId
                      ? 'border-[var(--color-ember)] bg-[var(--color-surface)]'
                      : 'border-[var(--color-line)] hover:border-[var(--color-graphite)]',
                  )}
                >
                  <span className="anvl-display text-[11px] tracking-[0.22em] text-[var(--color-ember-bright)]">
                    {formatChapterNumber(c.chapterNumber)} · {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className="anvl-heading mt-1 text-base font-normal leading-tight">{c.title}</span>
                  <span className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {c.acts.length} act{c.acts.length === 1 ? '' : 's'} · {c.cast.length} cast
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Selected chapter detail */}
      <div className="min-w-0">
        {selected ? (
          <div key={selected.id} className="space-y-8">
            <ChapterForm chapter={selected} onSaved={reload} onDeleted={reload} />
            <ActListEditor
              chapterId={selected.id}
              chapterSlug={selected.slug}
              acts={selected.acts}
              onChanged={reload}
            />
            <CastListEditor
              chapterId={selected.id}
              chapterSlug={selected.slug}
              acts={selected.acts}
              cast={selected.cast}
              onChanged={reload}
            />
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Select or create a chapter to begin.</p>
        )}
      </div>
    </div>
  )
}
