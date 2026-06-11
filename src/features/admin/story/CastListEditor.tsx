import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Save, Trash2 } from 'lucide-react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import {
  EMPTY_STORY_ASSET,
  STORY_RANKS,
  formatChapterNumber,
  type StoryAct,
  type StoryAsset,
  type StoryCastMember,
} from '@/features/story/schemas/story.schema'
import { StoryAssetField } from '@/features/admin/story/StoryAssetField'
import { deleteCast, upsertCast } from '@/features/admin/story/story.service'

const CHAPTER_SCOPE = '__chapter__'

interface CastListEditorProps {
  chapterId: string
  chapterSlug: string
  acts: StoryAct[]
  cast: StoryCastMember[]
  onChanged: () => Promise<void> | void
}

function CastCard({
  member,
  chapterId,
  chapterSlug,
  acts,
  onChanged,
}: {
  member: StoryCastMember
  chapterId: string
  chapterSlug: string
  acts: StoryAct[]
  onChanged: () => Promise<void> | void
}) {
  const [name, setName] = useState(member.name)
  const [rank, setRank] = useState(member.rank)
  const [blurb, setBlurb] = useState(member.blurb)
  const [actId, setActId] = useState<string | null>(member.actId)
  const [avatar, setAvatar] = useState<StoryAsset>(member.avatar)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await upsertCast({
        id: member.id,
        chapterId,
        actId,
        name,
        rank,
        blurb,
        avatar,
        sortOrder: member.sortOrder,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Character saved.')
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      const res = await deleteCast(member.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Character removed.')
      setConfirm(false)
      await onChanged()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminCard
      title={name || 'New character'}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField label="Name">
            <AdminInput value={name} onChange={(e) => setName(e.target.value)} />
          </AdminFormField>
          <AdminFieldSelect
            label="Rank"
            value={rank}
            onChange={setRank}
            options={STORY_RANKS.map((r) => ({ value: r, label: r }))}
          />
        </div>
        <AdminFieldSelect
          label="Appears in"
          value={actId ?? CHAPTER_SCOPE}
          onChange={(v) => setActId(v === CHAPTER_SCOPE ? null : v)}
          options={[
            { value: CHAPTER_SCOPE, label: 'Whole chapter' },
            ...acts.map((a) => ({
              value: a.id,
              label: `Act ${formatChapterNumber(a.actNumber)} — ${a.title}`,
            })),
          ]}
        />
        <AdminFormField label="Blurb">
          <AdminTextarea rows={3} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        </AdminFormField>
        <StoryAssetField label="Avatar" asset={avatar} scope={`${chapterSlug}-cast`} onChange={setAvatar} />
      </div>

      <AdminConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Remove this character?"
        confirmLabel="Remove"
        confirmVariant="destructive"
        confirmLoading={deleting}
        onConfirm={() => void remove()}
      >
        This removes the character from the roster.
      </AdminConfirmDialog>
    </AdminCard>
  )
}

/** Manage the CMS-authored cast (generals, recruits, loyal members) of a chapter. */
export function CastListEditor({ chapterId, chapterSlug, acts, cast, onChanged }: CastListEditorProps) {
  const [adding, setAdding] = useState(false)

  async function addMember() {
    setAdding(true)
    try {
      const res = await upsertCast({
        chapterId,
        actId: null,
        name: 'New recruit',
        rank: 'Recruit',
        blurb: '',
        avatar: EMPTY_STORY_ASSET,
        sortOrder: cast.length,
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
        <h3 className="anvl-heading text-lg font-normal">The Army (Cast)</h3>
        <AdminButton type="button" variant="secondary" size="sm" loading={adding} icon={<Plus size={14} />} onClick={() => void addMember()}>
          Add character
        </AdminButton>
      </div>
      {cast.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No characters yet. Enlist the first soldier of this chapter.</p>
      ) : (
        <div className="space-y-4">
          {cast.map((member) => (
            <CastCard key={member.id} member={member} chapterId={chapterId} chapterSlug={chapterSlug} acts={acts} onChanged={onChanged} />
          ))}
        </div>
      )}
    </section>
  )
}
