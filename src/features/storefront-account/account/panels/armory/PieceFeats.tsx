import { useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Share2, Trophy, X } from '@/shared/icons'
import { useArmoryFeatsQuery, useFeatMutations } from '@/features/passport/hooks/useArmory'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'
import { ShareModal } from '@/features/share/ShareModal'
import { useShareLauncher } from '@/features/share/useShareLauncher'
import { Switch } from '@/shared/components/ui/Switch'

/**
 * Feats, embedded in a piece's card — the record of what was earned IN this
 * piece ("Deadlift PR — 240 kg"). Add / edit / delete inline; each entry has a
 * date and a public/private switch (public ones surface on the shared armory).
 * The product is the card's piece — no picker needed.
 *
 * Every row can be shared, and a feat that has just been logged opens the
 * share sheet on itself: setting a PR is the moment worth posting, and asking
 * the athlete to go find it again afterwards loses it.
 */

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function PieceFeats({ slug }: { slug: string }) {
  const featsQuery = useArmoryFeatsQuery()
  const { create, update, remove } = useFeatMutations()
  const feats = (featsQuery.data ?? []).filter((f) => f.productSlug === slug)
  const [editing, setEditing] = useState<ArmoryFeat | 'new' | null>(null)
  const share = useShareLauncher({ pieceSlug: slug })
  const closeForm = () => setEditing(null)

  return (
    <div className="mt-3 border-t border-[var(--color-line)] pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="anvl-micro flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Trophy size={13} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
          Feats{feats.length > 0 ? ` · ${feats.length}` : ''}
        </p>
        {editing === null ? (
          <button
            type="button"
            onClick={() => setEditing('new')}
            aria-label="Log a feat in this piece"
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-highlight-bright)]"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {editing === 'new' ? (
        <PieceFeatForm
          pending={create.isPending}
          onCancel={closeForm}
          onSubmit={(input) =>
            create.mutate(
              { ...input, productSlug: slug },
              // Close only on a REAL success — a failed write keeps the form
              // (and its values) so nothing looks silently "added".
              {
                onSuccess: (r) => {
                  if (!r.ok) return
                  closeForm()
                  // `id` comes back from the insert, so the sheet can open
                  // preselected on the feat that was just forged.
                  if (r.id) share.open({ featId: r.id })
                },
              },
            )
          }
        />
      ) : null}

      {feats.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {feats.map((feat) =>
            editing !== 'new' && editing?.id === feat.id ? (
              <li key={feat.id}>
                <PieceFeatForm
                  initial={feat}
                  pending={update.isPending}
                  onCancel={closeForm}
                  onSubmit={(input) =>
                    update.mutate(
                      { id: feat.id, ...input, productSlug: slug },
                      { onSuccess: (r) => r.ok && closeForm() },
                    )
                  }
                />
              </li>
            ) : (
              <li key={feat.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[var(--color-heading)]">
                    {feat.title}
                  </p>
                  <p className="anvl-micro flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)]">
                    {new Date(feat.achievedOn).toLocaleDateString()}
                    {feat.isPublic ? (
                      <Eye size={12} aria-hidden="true" aria-label="Public" />
                    ) : (
                      <EyeOff size={12} aria-hidden="true" aria-label="Private" />
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => share.open({ featId: feat.id })}
                  aria-label={`Share feat: ${feat.title}`}
                  className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-highlight-bright)]"
                >
                  <Share2 size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(feat)}
                  aria-label={`Edit feat: ${feat.title}`}
                  className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)]"
                >
                  <Pencil size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(feat.id)}
                  disabled={remove.isPending}
                  aria-label={`Delete feat: ${feat.title}`}
                  className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-destructive)] disabled:opacity-40"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </li>
            ),
          )}
        </ul>
      ) : editing === null ? (
        <p className="anvl-micro mt-1 text-[9px] text-[var(--color-text-muted)]">
          No feats in this piece yet — log your first PR.
        </p>
      ) : null}

      {/* Mounted only while open: this component renders once per piece card,
          and the sheet pulls the catalog + profile behind it. */}
      {share.isOpen ? (
        <ShareModal
          open
          onClose={share.close}
          initialPieceSlug={share.initialPieceSlug}
          initialFeatId={share.initialFeatId}
        />
      ) : null}
    </div>
  )
}

function PieceFeatForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: ArmoryFeat
  pending: boolean
  onCancel: () => void
  onSubmit: (input: { title: string; achievedOn: string; isPublic: boolean }) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [achievedOn, setAchievedOn] = useState(initial?.achievedOn ?? todayIso())
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false)
  const trimmed = title.trim()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed) onSubmit({ title: trimmed, achievedOn, isPublic })
      }}
      className="mt-2 space-y-2 rounded-lg border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[var(--color-surface-elevated)] p-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={160}
        placeholder="Deadlift PR — 240 kg"
        aria-label="The feat"
        autoFocus
        className="focus-ring w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-base text-[var(--color-heading)] placeholder:text-[var(--color-text-muted)] md:text-xs"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={achievedOn}
          max={todayIso()}
          onChange={(e) => setAchievedOn(e.target.value)}
          aria-label="Date"
          className="focus-ring rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-base text-[var(--color-heading)] md:text-xs"
        />
        <Switch
          checked={isPublic}
          onChange={setIsPublic}
          size="sm"
          label={isPublic ? 'Public' : 'Private'}
        />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="submit"
            disabled={!trimmed || pending}
            className="focus-ring rounded-full bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-on-highlight)] disabled:opacity-50"
          >
            {initial ? 'Save' : 'Add'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
