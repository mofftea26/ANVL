import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { AdminEntityCard } from '@/features/admin/components/AdminEntityCard'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import type { StoryAct, StoryAsset } from '@/features/story/schemas/story.schema'
import { EMPTY_STORY_ASSET } from '@/features/story/schemas/story.schema'
import { StoryAssetField } from '@/features/admin/story/StoryAssetField'
import { deleteAct, upsertAct } from '@/features/admin/story/story.service'
import { ICON_SIZE } from '@/shared/lib/iconSize'

interface ActListEditorProps {
  chapterId: string
  chapterSlug: string
  acts: StoryAct[]
  onChanged: () => Promise<void> | void
}

function ActCard({
  act,
  chapterId,
  chapterSlug,
  onChanged,
}: {
  act: StoryAct
  chapterId: string
  chapterSlug: string
  onChanged: () => Promise<void> | void
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
      title={`Act ${actNumber}`}
      onSave={save}
      saving={saving}
      onConfirmDelete={remove}
      deleteConfirmTitle="Delete this act?"
      deleteConfirmBody="This removes the act and its cast. This cannot be undone."
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
        <FormField label="Story" hint="Separate paragraphs with a blank line." labelStyle="stacked">
          <Textarea density="compact" rows={6} value={story} onChange={(e) => setStory(e.target.value)} />
        </FormField>
        <StoryAssetField label="Act media" asset={asset} scope={chapterSlug} onChange={setAsset} />
      </div>
    </AdminEntityCard>
  )
}

/** Manage the ordered acts within a chapter (each saved individually). */
export function ActListEditor({ chapterId, chapterSlug, acts, onChanged }: ActListEditorProps) {
  const [adding, setAdding] = useState(false)

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
      await onChanged()
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
        <div className="space-y-4">
          {acts.map((act) => (
            <ActCard key={act.id} act={act} chapterId={chapterId} chapterSlug={chapterSlug} onChanged={onChanged} />
          ))}
        </div>
      )}
    </section>
  )
}
