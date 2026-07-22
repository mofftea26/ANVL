import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { CastProfileNameField } from '@/features/admin/story/CastProfileNameField'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import {
  listSaga,
  upsertAct,
  upsertCast,
  upsertChapter,
} from '@/features/admin/story/story.service'
import {
  DEFAULT_BOOK_COLORS,
  EMPTY_STORY_ASSET,
  formatChapterNumber,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'

const STORY_LINK = [{ label: 'Full chapter editor (covers, colors, media)', to: '/admin/story' }]

interface StorySagaState {
  chapters: StoryChapter[]
  loading: boolean
  error: string | null
  selectedId: string | null
  select: (id: string) => void
  reload: () => Promise<void>
}

interface StoryStepProps {
  saga: StorySagaState
  onNavigate: () => void
}

/** Domain chapter → service draft (for partial updates like the publish flip). */
function chapterToDraft(chapter: StoryChapter) {
  return {
    id: chapter.id,
    slug: chapter.slug,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    subtitle: chapter.subtitle,
    description: chapter.description,
    productSlug: chapter.productSlug,
    dropLabel: chapter.dropLabel,
    dropSlug: chapter.dropSlug,
    cover: chapter.cover,
    coverLogo: chapter.coverLogo,
    colors: chapter.colors ?? DEFAULT_BOOK_COLORS,
    sortOrder: chapter.chapterNumber,
    isPublished: chapter.isPublished,
  }
}

/** Chapter picker shared by the acts / cast / publish steps. */
function ChapterSelect({ saga }: { saga: StorySagaState }) {
  return (
    <AdminFieldSelect
      label="Chapter"
      value={saga.selectedId ?? ''}
      onChange={saga.select}
      placeholder={saga.loading ? 'Loading saga…' : 'Select a chapter…'}
      options={saga.chapters.map((c) => ({
        value: c.id,
        label: `${formatChapterNumber(c.chapterNumber)} · ${c.title}`,
        description: c.isPublished ? 'Published' : 'Draft',
      }))}
    />
  )
}

function sagaStatus(saga: StorySagaState): { state: 'done' | 'todo' | 'info'; label: string } {
  if (saga.error) return { state: 'info', label: saga.error }
  if (saga.loading) return { state: 'info', label: 'Loading the saga…' }
  return saga.chapters.length > 0
    ? {
        state: 'done',
        label: `${saga.chapters.length} chapter${saga.chapters.length === 1 ? '' : 's'} in the saga`,
      }
    : { state: 'todo', label: 'No chapters yet — create the first book' }
}

/** Step 1 — create a chapter (a product may carry several books) inline. */
function ChapterStep({ saga, onNavigate }: StoryStepProps) {
  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []

  const [title, setTitle] = useState('')
  const [productSlug, setProductSlug] = useState('')
  const [dropLabel, setDropLabel] = useState('')
  const [dropSlug, setDropSlug] = useState('')
  const [creating, setCreating] = useState(false)

  const create = async () => {
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      toast.error('Give the chapter a title.')
      return
    }
    setCreating(true)
    try {
      const next = saga.chapters.length + 1
      const res = await upsertChapter({
        slug: `${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'chapter'}-${Date.now().toString(36)}`,
        chapterNumber: next,
        title: cleanTitle,
        subtitle: `Drop ${formatChapterNumber(next)}`,
        description: '',
        productSlug,
        dropLabel: dropLabel.trim(),
        dropSlug: dropSlug.trim(),
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
      toast.success(`Chapter “${cleanTitle}” created (draft).`)
      setTitle('')
      await saga.reload()
      saga.select(res.data)
    } finally {
      setCreating(false)
    }
  }

  return (
    <SetupStepBody
      intro="A chapter is one book on the Story shelf, grouped by drop — a product may carry several chapters (the PDP and passport embed the first by sort order). Create it here with the essentials; covers, colors, and art live in the full editor."
      status={sagaStatus(saga)}
      links={STORY_LINK}
      onNavigate={onNavigate}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Title" labelStyle="stacked">
          <Input density="compact" value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField label="Assigned product" labelStyle="stacked">
          <select
            aria-label="Assigned product"
            className="focus-ring h-9 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
            value={productSlug}
            onChange={(e) => {
              setProductSlug(e.target.value)
              const p = products.find((x) => x.slug === e.target.value)
              if (p) {
                if (!dropLabel) setDropLabel(p.dropName ?? '')
                if (!dropSlug)
                  setDropSlug(
                    p.shop?.dropSlug ??
                      p.dropName?.toLowerCase().replace(/\s+/g, '-') ??
                      '',
                  )
              }
            }}
          >
            <option value="">— None (standalone chapter) —</option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Drop label" labelStyle="stacked" hint="Shelf section heading.">
          <Input
            density="compact"
            value={dropLabel}
            onChange={(e) => setDropLabel(e.target.value)}
          />
        </FormField>
        <FormField label="Drop slug" labelStyle="stacked" hint="Groups books on the shelf.">
          <Input
            density="compact"
            value={dropSlug}
            onChange={(e) => setDropSlug(e.target.value)}
          />
        </FormField>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        density="compact"
        loading={creating}
        onClick={() => void create()}
      >
        Create chapter
      </Button>
    </SetupStepBody>
  )
}

/** Step 2 — add acts (the book's pages) to the selected chapter. */
function ActsStep({ saga, onNavigate }: StoryStepProps) {
  const chapter = saga.chapters.find((c) => c.id === saga.selectedId) ?? null
  const [title, setTitle] = useState('')
  const [story, setStory] = useState('')
  const [adding, setAdding] = useState(false)

  const add = async () => {
    if (!chapter) return
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      toast.error('Give the act a title.')
      return
    }
    setAdding(true)
    try {
      const nextNumber = chapter.acts.length + 1
      const res = await upsertAct({
        chapterId: chapter.id,
        actNumber: nextNumber,
        title: cleanTitle,
        story,
        asset: EMPTY_STORY_ASSET,
        sortOrder: nextNumber,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Act “${cleanTitle}” added.`)
      setTitle('')
      setStory('')
      await saga.reload()
    } finally {
      setAdding(false)
    }
  }

  return (
    <SetupStepBody
      intro="Acts are the ordered story beats inside a chapter — the pages readers turn in the book overlay. Add the beats here; imagery and reordering live in the full editor."
      status={
        chapter
          ? {
              state: chapter.acts.length > 0 ? 'done' : 'todo',
              label: `${chapter.acts.length} act${chapter.acts.length === 1 ? '' : 's'} in “${chapter.title}”`,
            }
          : sagaStatus(saga)
      }
      links={STORY_LINK}
      onNavigate={onNavigate}
    >
      <ChapterSelect saga={saga} />
      {chapter ? (
        <>
          {chapter.acts.length > 0 ? (
            <ul className="space-y-1 text-xs text-[var(--color-text-muted)]">
              {chapter.acts.map((act) => (
                <li key={act.id} className="truncate">
                  {formatChapterNumber(act.actNumber)} · {act.title}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Act title" labelStyle="stacked">
              <Input
                density="compact"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormField>
            <FormField label="Story" labelStyle="stacked">
              <Textarea
                density="compact"
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
              />
            </FormField>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            loading={adding}
            onClick={() => void add()}
          >
            Add act
          </Button>
        </>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Create or select a chapter first.
        </p>
      )}
    </SetupStepBody>
  )
}

/** Step 3 — add cast (the army roster) to the selected chapter. */
function CastStep({ saga, onNavigate }: StoryStepProps) {
  const chapter = saga.chapters.find((c) => c.id === saga.selectedId) ?? null
  const [name, setName] = useState('')
  const [rank, setRank] = useState('')
  // True after picking a real athlete — rank becomes a read-only snapshot.
  const [fromProfile, setFromProfile] = useState(false)
  const [blurb, setBlurb] = useState('')
  const [adding, setAdding] = useState(false)

  const add = async () => {
    if (!chapter) return
    const cleanName = name.trim()
    if (!cleanName) {
      toast.error('Give the character a name.')
      return
    }
    setAdding(true)
    try {
      const res = await upsertCast({
        chapterId: chapter.id,
        actId: null,
        name: cleanName,
        rank,
        blurb,
        avatar: EMPTY_STORY_ASSET,
        sortOrder: chapter.cast.length + 1,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`“${cleanName}” joined the cast.`)
      setName('')
      setRank('')
      setFromProfile(false)
      setBlurb('')
      await saga.reload()
    } finally {
      setAdding(false)
    }
  }

  return (
    <SetupStepBody
      intro="The cast is the saga's character roster — CMS-authored warriors that appear alongside the chapter. Optional, but it gives the drop its army. Avatars are added in the full editor."
      status={
        chapter
          ? {
              state: chapter.cast.length > 0 ? 'done' : 'info',
              label: `${chapter.cast.length} cast member${chapter.cast.length === 1 ? '' : 's'} in “${chapter.title}”`,
            }
          : sagaStatus(saga)
      }
      links={STORY_LINK}
      onNavigate={onNavigate}
    >
      <ChapterSelect saga={saga} />
      {chapter ? (
        <>
          {chapter.cast.length > 0 ? (
            <ul className="space-y-1 text-xs text-[var(--color-text-muted)]">
              {chapter.cast.map((member) => (
                <li key={member.id} className="truncate">
                  {member.name} · {member.rank}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <CastProfileNameField
              name={name}
              onNameChange={(next) => {
                setName(next)
                setFromProfile(false)
              }}
              onProfileSelect={(snapshot) => {
                setName(snapshot.name)
                setRank(snapshot.rank)
                setFromProfile(true)
              }}
            />
            <FormField
              label="Rank"
              labelStyle="stacked"
              hint={
                fromProfile
                  ? 'Derived from the athlete’s armory (claims only) — a snapshot; it does not live-update.'
                  : 'Free text — defaults to Recruit when blank.'
              }
            >
              <Input
                density="compact"
                value={rank}
                readOnly={fromProfile}
                onChange={(e) => setRank(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Blurb" labelStyle="stacked">
            <Textarea
              density="compact"
              rows={2}
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
            />
          </FormField>
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            loading={adding}
            onClick={() => void add()}
          >
            Add character
          </Button>
        </>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Create or select a chapter first.
        </p>
      )}
    </SetupStepBody>
  )
}

/** Step 4 — flip the selected chapter's Published toggle. */
function PublishStep({ saga, onNavigate }: StoryStepProps) {
  const chapter = saga.chapters.find((c) => c.id === saga.selectedId) ?? null
  const [saving, setSaving] = useState(false)

  const setPublished = async (isPublished: boolean) => {
    if (!chapter) return
    setSaving(true)
    try {
      const res = await upsertChapter({ ...chapterToDraft(chapter), isPublished })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(isPublished ? 'Chapter published.' : 'Chapter unpublished.')
      await saga.reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <SetupStepBody
      intro="Only published chapters (and their acts and cast) are visible on the storefront Story page. Flip the toggle when the book is ready to shelve."
      status={
        chapter
          ? {
              state: chapter.isPublished ? 'done' : 'todo',
              label: chapter.isPublished
                ? `“${chapter.title}” is live on /story`
                : `“${chapter.title}” is a draft — invisible to visitors`,
            }
          : sagaStatus(saga)
      }
      links={STORY_LINK}
      onNavigate={onNavigate}
    >
      <ChapterSelect saga={saga} />
      {chapter ? (
        <Checkbox
          label="Published"
          description="Only published chapters are visible on the storefront."
          checked={chapter.isPublished}
          disabled={saving}
          onChange={(e) => void setPublished(e.target.checked)}
        />
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Create or select a chapter first.
        </p>
      )}
    </SetupStepBody>
  )
}

/** Story — create the chapter, add acts and cast, publish. All inline. */
export function StorySetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [chapters, setChapters] = useState<StoryChapter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  // Load the saga when the wizard opens (Supabase-relational — no local copy).
  useEffect(() => {
    if (!open) return
    let mounted = true
    setLoading(true)
    void reload().finally(() => {
      if (mounted) setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [open, reload])

  const saga: StorySagaState = {
    chapters,
    loading,
    error,
    selectedId,
    select: setSelectedId,
    reload,
  }

  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Story setup"
      steps={[
        {
          key: 'chapter',
          title: 'Chapter',
          blurb: 'A book on the Story shelf — products may carry several.',
          preview: { route: '/story' },
          render: () => <ChapterStep saga={saga} onNavigate={onClose} />,
        },
        {
          key: 'acts',
          title: 'Acts',
          blurb: 'The ordered pages inside the book.',
          preview: { route: '/story' },
          render: () => <ActsStep saga={saga} onNavigate={onClose} />,
        },
        {
          key: 'cast',
          title: 'Cast',
          blurb: 'The saga’s character roster.',
          preview: { route: '/story' },
          render: () => <CastStep saga={saga} onNavigate={onClose} />,
        },
        {
          key: 'publish',
          title: 'Publish',
          blurb: 'Only published chapters reach the storefront.',
          preview: { route: '/story' },
          render: () => <PublishStep saga={saga} onNavigate={onClose} />,
        },
      ]}
    />
  )
}
