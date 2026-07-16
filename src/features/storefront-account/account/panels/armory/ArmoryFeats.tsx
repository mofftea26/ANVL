import { useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Trophy, X } from 'lucide-react'
import { useArmoryFeatsQuery, useFeatMutations } from '@/features/passport/hooks/useArmory'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'
import { cn } from '@/shared/lib/cn'

/**
 * Feats — the owner's log of what they've earned in the piece: "Deadlift PR —
 * 240 kg", dated, each publicly shown or kept private. Add / edit / delete,
 * with the public ones surfacing on a shared armory (Phase G4).
 */

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** A piece the owner can attach a feat to. */
export interface FeatPiece {
  slug: string
  name: string
}

export function ArmoryFeats({ pieces }: { pieces: FeatPiece[] }) {
  const featsQuery = useArmoryFeatsQuery()
  const { create, update, remove } = useFeatMutations()
  const feats = featsQuery.data ?? []
  const [editing, setEditing] = useState<ArmoryFeat | 'new' | null>(null)
  const nameBySlug = new Map(pieces.map((p) => [p.slug, p.name]))

  const closeForm = () => setEditing(null)

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
          <h3 className="anvl-heading text-lg text-[var(--color-heading)]">Feats</h3>
        </div>
        {editing === null ? (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-heading)] motion-safe:transition-colors hover:bg-[color-mix(in_oklab,var(--color-highlight)_12%,transparent)]"
          >
            <Plus size={13} aria-hidden="true" /> Log a feat
          </button>
        ) : null}
      </div>

      <p className="anvl-micro mt-1 text-[var(--color-text-muted)]">
        Personal records and milestones. Public feats show on your shared armory.
      </p>

      {editing === 'new' ? (
        <FeatForm
          pieces={pieces}
          pending={create.isPending}
          onCancel={closeForm}
          onSubmit={(input) => create.mutate(input, { onSuccess: closeForm })}
        />
      ) : null}

      <ul className="mt-4 space-y-2">
        {feats.map((feat) =>
          editing !== 'new' && editing?.id === feat.id ? (
            <li key={feat.id}>
              <FeatForm
                initial={feat}
                pieces={pieces}
                pending={update.isPending}
                onCancel={closeForm}
                onSubmit={(input) =>
                  update.mutate({ id: feat.id, ...input }, { onSuccess: closeForm })
                }
              />
            </li>
          ) : (
            <li
              key={feat.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                  {feat.title}
                </p>
                <p className="anvl-micro mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                  <span>{new Date(feat.achievedOn).toLocaleDateString()}</span>
                  {feat.productSlug && nameBySlug.has(feat.productSlug) ? (
                    <span className="text-[var(--color-highlight-bright)]">
                      {nameBySlug.get(feat.productSlug)}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    {feat.isPublic ? (
                      <>
                        <Eye size={11} aria-hidden="true" /> Public
                      </>
                    ) : (
                      <>
                        <EyeOff size={11} aria-hidden="true" /> Private
                      </>
                    )}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(feat)}
                aria-label={`Edit feat: ${feat.title}`}
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)]"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(feat.id)}
                disabled={remove.isPending}
                aria-label={`Delete feat: ${feat.title}`}
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-destructive)] disabled:opacity-40"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </li>
          ),
        )}
      </ul>

      {feats.length === 0 && editing === null ? (
        <p className="anvl-micro mt-4 text-[var(--color-text-muted)]">
          No feats logged yet. Mark your first PR.
        </p>
      ) : null}
    </section>
  )
}

function FeatForm({
  initial,
  pieces,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: ArmoryFeat
  pieces: FeatPiece[]
  pending: boolean
  onCancel: () => void
  onSubmit: (input: {
    title: string
    achievedOn: string
    isPublic: boolean
    productSlug: string | null
  }) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [achievedOn, setAchievedOn] = useState(initial?.achievedOn ?? todayIso())
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false)
  const [productSlug, setProductSlug] = useState<string>(initial?.productSlug ?? '')
  const trimmed = title.trim()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed) onSubmit({ title: trimmed, achievedOn, isPublic, productSlug: productSlug || null })
      }}
      className="mt-4 space-y-3 rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[var(--color-surface-elevated)] p-4"
    >
      <div>
        <label
          htmlFor="feat-title"
          className="anvl-micro mb-1 block text-[10px] text-[var(--color-text-muted)]"
        >
          The feat
        </label>
        <input
          id="feat-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          placeholder="Deadlift PR — 240 kg"
          autoFocus
          className="focus-ring w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-heading)] placeholder:text-[var(--color-text-muted)] md:text-sm"
        />
      </div>
      {pieces.length > 0 ? (
        <div>
          <label
            htmlFor="feat-piece"
            className="anvl-micro mb-1 block text-[10px] text-[var(--color-text-muted)]"
          >
            Wearing (optional)
          </label>
          <select
            id="feat-piece"
            value={productSlug}
            onChange={(e) => setProductSlug(e.target.value)}
            className="focus-ring w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-heading)] md:text-sm"
          >
            <option value="">— No piece —</option>
            {pieces.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="feat-date"
            className="anvl-micro mb-1 block text-[10px] text-[var(--color-text-muted)]"
          >
            Date
          </label>
          <input
            id="feat-date"
            type="date"
            value={achievedOn}
            max={todayIso()}
            onChange={(e) => setAchievedOn(e.target.value)}
            className="focus-ring rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-heading)] md:text-sm"
          />
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((v) => !v)}
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)] motion-safe:transition-colors"
        >
          <span
            aria-hidden="true"
            className={cn(
              'relative h-4 w-7 rounded-full motion-safe:transition-colors',
              isPublic ? 'bg-[var(--color-highlight-bright)]' : 'bg-[var(--color-surface)]',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-3 w-3 rounded-full bg-[var(--color-heading)] motion-safe:transition-transform',
                isPublic ? 'translate-x-3.5' : 'translate-x-0.5',
              )}
            />
          </span>
          {isPublic ? 'Public' : 'Private'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!trimmed || pending}
          className="focus-ring rounded-full bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-on-highlight)] disabled:opacity-50"
        >
          {initial ? 'Save' : 'Add feat'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
