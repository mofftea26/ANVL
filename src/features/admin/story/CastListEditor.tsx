import { useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink, Plus, User } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { AdminEntityCard } from '@/features/admin/components/AdminEntityCard'
import { FormField } from '@/shared/components/ui/FormField'
import {
  EMPTY_STORY_ASSET,
  type StoryAsset,
  type StoryCastMember,
} from '@/features/story/schemas/story.schema'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'
import { CastProfileNameField } from '@/features/admin/story/CastProfileNameField'
import { deleteCast, upsertCast } from '@/features/admin/story/story.service'
import { ICON_SIZE } from '@/shared/lib/iconSize'

interface CastListEditorProps {
  chapterId: string
  cast: StoryCastMember[]
  onChanged: () => Promise<void> | void
}

/** Build an image StoryAsset from a profile picture URL (empty → cleared). */
function avatarFromUrl(url: string): StoryAsset {
  const clean = url.trim()
  if (!clean) return EMPTY_STORY_ASSET
  return { ...EMPTY_STORY_ASSET, kind: 'image', url: clean }
}

function CastCard({
  member,
  chapterId,
  onChanged,
}: {
  member: StoryCastMember
  chapterId: string
  onChanged: () => Promise<void> | void
}) {
  const [name, setName] = useState(member.name)
  // Rank + avatar are athlete snapshots — never author-entered.
  const [rank, setRank] = useState(member.rank)
  const [avatar, setAvatar] = useState<StoryAsset>(member.avatar)
  const [profileUserId, setProfileUserId] = useState<string | null>(member.profileUserId)
  const [armoryHandle, setArmoryHandle] = useState<string | null>(member.armoryHandle)
  const [saving, setSaving] = useState(false)

  const preview = resolveStoryAsset(avatar)
  const linked = profileUserId !== null

  async function save() {
    setSaving(true)
    try {
      const res = await upsertCast({
        id: member.id,
        chapterId,
        name,
        rank,
        avatar,
        profileUserId,
        armoryHandle,
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
        <div className="flex items-start gap-4">
          {/* Avatar = the athlete's profile picture (auto). Monogram fallback. */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-text-muted)]"
            aria-hidden="true"
          >
            {preview.type === 'image' ? (
              <img src={preview.src} alt="" className="h-full w-full object-cover" />
            ) : name.trim() ? (
              <span className="anvl-heading text-lg text-[var(--color-heading)]">
                {name.trim().charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={ICON_SIZE.md} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <CastProfileNameField
              name={name}
              onNameChange={(next) => {
                setName(next)
                // Typing over a linked athlete breaks the verified link.
                setProfileUserId(null)
                setArmoryHandle(null)
              }}
              onProfileSelect={(snapshot) => {
                setName(snapshot.name)
                setRank(snapshot.rank)
                setAvatar(avatarFromUrl(snapshot.avatarUrl))
                setProfileUserId(snapshot.userId)
                setArmoryHandle(snapshot.armoryHandle)
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Rank is derived from the athlete's armory — read-only. */}
          <FormField
            label="Rank"
            hint={
              linked
                ? 'Derived from the athlete’s armory — a snapshot; it does not live-update.'
                : 'Set automatically when you pick a real athlete above.'
            }
            labelStyle="stacked"
          >
            <div className="inline-flex min-h-[2.25rem] items-center rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)]">
              {rank || 'Recruit'}
            </div>
          </FormField>

          {/* Guest-armory link status. */}
          <FormField
            label="Guest armory"
            hint="A public, minted armory links the name in the story to their guest armory."
            labelStyle="stacked"
          >
            <div className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text-muted)]">
              {armoryHandle ? (
                <>
                  <ExternalLink size={ICON_SIZE.sm} aria-hidden="true" />
                  <span className="text-[var(--color-text)]">@{armoryHandle}</span>
                </>
              ) : linked ? (
                'Armory not public — name shown, not linked.'
              ) : (
                'Lore character — no link.'
              )}
            </div>
          </FormField>
        </div>
      </div>
    </AdminEntityCard>
  )
}

/** Manage the CMS-authored cast (generals, recruits, loyal members) of a chapter. */
export function CastListEditor({ chapterId, cast, onChanged }: CastListEditorProps) {
  const [adding, setAdding] = useState(false)

  async function addMember() {
    setAdding(true)
    try {
      const res = await upsertCast({
        chapterId,
        name: 'New recruit',
        rank: 'Recruit',
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
      <p className="text-xs text-[var(--color-text-muted)]">
        Search a real athlete to enlist them — their rank and avatar come straight from their
        armory, and their name becomes clickable wherever the story mentions it. Everyone enlisted
        here appears in the whole chapter.
      </p>
      {cast.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No characters yet. Enlist the first soldier of this chapter.</p>
      ) : (
        <div className="space-y-4">
          {cast.map((member) => (
            <CastCard key={member.id} member={member} chapterId={chapterId} onChanged={onChanged} />
          ))}
        </div>
      )}
    </section>
  )
}
