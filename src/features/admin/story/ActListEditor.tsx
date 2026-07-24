import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Menu, Plus } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { AdminEntityCard } from '@/features/admin/components/AdminEntityCard'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import {
  formatChapterNumber,
  type StoryAct,
  type StoryAsset,
} from '@/features/story/schemas/story.schema'
import { EMPTY_STORY_ASSET } from '@/features/story/schemas/story.schema'
import { StoryAssetField } from '@/features/admin/story/StoryAssetField'
import { deleteAct, upsertAct } from '@/features/admin/story/story.service'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

interface ActListEditorProps {
  chapterId: string
  chapterSlug: string
  acts: StoryAct[]
  /** Chapter reload; also receives an optional act id to select after add. */
  onChanged: (selectActId?: string) => Promise<void> | void
}

function actChipLabel(act: StoryAct): string {
  return `Act ${formatChapterNumber(act.actNumber)} — ${act.title || 'Untitled'}`
}

/**
 * The selected act's editor. Keyed by act id in the parent so switching chips
 * remounts it fresh from the latest saved values — save in-card edits before
 * switching (each act persists individually).
 */
function ActCard({
  act,
  chapterId,
  chapterSlug,
  onChanged,
  header,
}: {
  act: StoryAct
  chapterId: string
  chapterSlug: string
  onChanged: () => Promise<void> | void
  header: React.ReactNode
}) {
  const [title, setTitle] = useState(act.title)
  const [story, setStory] = useState(act.story)
  const [actNumber, setActNumber] = useState(act.actNumber)
  const [sortOrder, setSortOrder] = useState(act.actNumber)
  const [asset, setAsset] = useState<StoryAsset>(act.asset)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await upsertAct({
        id: act.id,
        chapterId,
        actNumber,
        title,
        story,
        asset,
        sortOrder,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Act saved.')
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    const res = await deleteAct(act.id)
    if (!res.ok) {
      toast.error(res.error)
      return false
    }
    toast.success('Act removed.')
    await onChanged()
    return true
  }

  return (
    <AdminEntityCard
      title={
        <span className="inline-flex items-center gap-2">
          Act {formatChapterNumber(actNumber)}
          {header}
        </span>
      }
      onSave={save}
      saving={saving}
      onConfirmDelete={remove}
      deleteConfirmTitle="Delete this act?"
      deleteConfirmBody="This removes the act. This cannot be undone."
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <FormField label="Title" labelStyle="stacked">
            <Input density="compact" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField label="Act #" labelStyle="stacked">
            <Input
              density="compact"
              type="number"
              className="w-24"
              value={actNumber}
              onChange={(e) => {
                const n = Number(e.target.value) || 0
                setActNumber(n)
                setSortOrder(n)
              }}
            />
          </FormField>
        </div>
        <FormField label="Story" hint="Separate paragraphs with a blank line. Enlisted cast names are highlighted and linked automatically in the story." labelStyle="stacked">
          <Textarea density="compact" rows={6} value={story} onChange={(e) => setStory(e.target.value)} />
        </FormField>
        <StoryAssetField label="Act media" asset={asset} scope={chapterSlug} onChange={setAsset} />
      </div>
    </AdminEntityCard>
  )
}

/**
 * The chapter's ordered acts, edited ONE AT A TIME behind a sideways-scrolling
 * chip row (the About-orb / Oath-product pattern). Chips are drag-reorderable
 * (native HTML5 drag via {@link useSortableList}, with keyboard move
 * earlier/later buttons as the accessible fallback); a reorder renumbers the
 * stored acts and persists sort_order. Selecting a chip opens that act below.
 */
export function ActListEditor({ chapterId, chapterSlug, acts, onChanged }: ActListEditorProps) {
  const [adding, setAdding] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(acts[0]?.id ?? null)

  const selectedIndex = Math.max(
    0,
    acts.findIndex((a) => a.id === selectedId),
  )
  const selected = acts[selectedIndex] ?? acts[0] ?? null

  // Reorder = renumber the stored acts sequentially and upsert the changed
  // ones. Uses stored values — save in-card edits before reordering.
  async function reorder(from: number, to: number) {
    if (reordering) return
    setReordering(true)
    try {
      const next = [...acts]
      const [moved] = next.splice(from, 1)
      if (!moved) return
      next.splice(to, 0, moved)
      setSelectedId(moved.id)
      for (const [idx, act] of next.entries()) {
        const n = idx + 1
        if (act.actNumber === n) continue
        const res = await upsertAct({
          id: act.id,
          chapterId,
          actNumber: n,
          title: act.title,
          story: act.story,
          asset: act.asset,
          sortOrder: n,
        })
        if (!res.ok) {
          toast.error(res.error)
          break
        }
      }
      await onChanged()
    } finally {
      setReordering(false)
    }
  }

  const sortable = useSortableList({
    length: acts.length,
    onMove: (from, to) => void reorder(from, to),
  })

  async function addAct() {
    setAdding(true)
    try {
      const next = acts.length + 1
      const res = await upsertAct({
        chapterId,
        actNumber: next,
        title: `Act ${next}`,
        story: '',
        asset: EMPTY_STORY_ASSET,
        sortOrder: next,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setSelectedId(res.data)
      await onChanged(res.data)
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="anvl-heading text-lg font-normal">Acts</h3>
        <Button type="button" variant="secondary" size="sm" density="compact" loading={adding} onClick={() => void addAct()}>
          <Plus size={ICON_SIZE.sm} />
          Add act
        </Button>
      </div>

      {acts.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No acts yet. Add the first beat of this chapter.</p>
      ) : (
        <>
          {/* Chip row — pick one act to edit. Drag a chip to reorder (save
              in-card edits first); the arrows are the keyboard fallback. */}
          <div
            role="tablist"
            aria-label="Chapter acts"
            className="flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:thin]"
          >
            {acts.map((act, i) => {
              const active = i === selectedIndex
              return (
                <button
                  key={act.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  {...sortable.getHandleProps(i)}
                  {...sortable.getItemProps(i)}
                  onClick={() => setSelectedId(act.id)}
                  title="Click to edit · drag to reorder"
                  className={cn(
                    'focus-ring inline-flex shrink-0 cursor-grab items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition-colors active:cursor-grabbing data-[drag-over]:border-[var(--color-accent)] data-[drag-over]:ring-2 data-[drag-over]:ring-[var(--color-accent)]',
                    active
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-heading)]'
                      : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]',
                  )}
                >
                  <Menu size={ICON_SIZE.xs} aria-hidden="true" />
                  {actChipLabel(act)}
                </button>
              )
            })}
          </div>

          {selected ? (
            <ActCard
              key={selected.id}
              act={selected}
              chapterId={chapterId}
              chapterSlug={chapterSlug}
              onChanged={onChanged}
              header={
                <span className="inline-flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Move ${actChipLabel(selected)} earlier`}
                    disabled={selectedIndex === 0 || reordering}
                    onClick={() => sortable.moveUp(selectedIndex)}
                    className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    <ChevronUp size={ICON_SIZE.sm} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${actChipLabel(selected)} later`}
                    disabled={selectedIndex === acts.length - 1 || reordering}
                    onClick={() => sortable.moveDown(selectedIndex)}
                    className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    <ChevronDown size={ICON_SIZE.sm} aria-hidden="true" />
                  </button>
                </span>
              }
            />
          ) : null}
        </>
      )}
    </section>
  )
}
