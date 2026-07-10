import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { AdminEntityCard } from '@/features/admin/components/AdminEntityCard'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
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
import { ICON_SIZE } from '@/shared/lib/iconSize'

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
    const res = await deleteCast(member.id)
    if (!res.ok) {
      toast.error(res.error)
      return false
    }
    toast.success('Character removed.')
    await onChanged()
    return true
  }

  return (
    <AdminEntityCard
      title={name || 'New character'}
      onSave={save}
      saving={saving}
      deleteLabel="Remove"
      onConfirmDelete={remove}
      deleteConfirmTitle="Remove this character?"
      deleteConfirmBody="This removes the character from the roster."
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" labelStyle="stacked">
            <Input density="compact" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
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
        <FormField label="Blurb" labelStyle="stacked">
          <Textarea density="compact" rows={3} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        </FormField>
        <StoryAssetField label="Avatar" asset={avatar} scope={`${chapterSlug}-cast`} onChange={setAvatar} />
      </div>
    </AdminEntityCard>
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
        <Button type="button" variant="secondary" size="sm" density="compact" loading={adding} onClick={() => void addMember()}>
          <Plus size={ICON_SIZE.sm} />
          Add character
        </Button>
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
