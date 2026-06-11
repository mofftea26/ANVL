import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Save, Trash2 } from 'lucide-react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import type { StoryAct, StoryAsset } from '@/features/story/schemas/story.schema'
import { EMPTY_STORY_ASSET } from '@/features/story/schemas/story.schema'
import { StoryAssetField } from '@/features/admin/story/StoryAssetField'
import { deleteAct, upsertAct } from '@/features/admin/story/story.service'

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
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    setDeleting(true)
    try {
      const res = await deleteAct(act.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Act removed.')
      setConfirm(false)
      await onChanged()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminCard
      title={`Act ${actNumber}`}
      actions={
        <div className="flex gap-2">
          <AdminButton type="button" variant="primary" size="sm" loading={saving} icon={<Save size={14} />} onClick={() => void save()}>
            Save
          </AdminButton>
          <AdminButton type="button" variant="destructive" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirm(true)}>
            Delete
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <AdminFormField label="Title">
            <AdminInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Act #">
            <AdminInput
              type="number"
              className="w-24"
              value={actNumber}
              onChange={(e) => {
                const n = Number(e.target.value) || 0
                setActNumber(n)
                setSortOrder(n)
              }}
            />
          </AdminFormField>
        </div>
        <AdminFormField label="Story" hint="Separate paragraphs with a blank line.">
          <AdminTextarea rows={6} value={story} onChange={(e) => setStory(e.target.value)} />
        </AdminFormField>
        <StoryAssetField label="Act media" asset={asset} scope={chapterSlug} onChange={setAsset} />
      </div>

      <AdminConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this act?"
        confirmLabel="Delete act"
        confirmVariant="destructive"
        confirmLoading={deleting}
        onConfirm={() => void remove()}
      >
        This removes the act and its cast. This cannot be undone.
      </AdminConfirmDialog>
    </AdminCard>
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
        <AdminButton type="button" variant="secondary" size="sm" loading={adding} icon={<Plus size={14} />} onClick={() => void addAct()}>
          Add act
        </AdminButton>
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
