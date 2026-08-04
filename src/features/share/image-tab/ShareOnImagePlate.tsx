import type { ReactNode } from 'react'
import { ChevronDown, Shirt, Star, Trophy } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import { featDate } from '../image/drawKit'
import type { ShareContext, ShareFeat, SharePiece } from '../types'

/**
 * What the image will actually SAY.
 *
 * This used to be two bare grey `<select>` elements labelled "The piece" and
 * "Add a feat" — admin chrome, stacked under the preview, reading as settings
 * rather than as content. Here each row shows the thing itself (the piece with
 * its artwork and wear count, the feat with its date) and the picker is an
 * invisible native `<select>` laid over the row.
 *
 * Native picker on purpose: this sheet is phone-first and already scrolls
 * internally, so the OS wheel beats a popover trapped inside a scroll
 * container — and it needs no "cleared" sentinel value, which a Radix
 * `Select.Item` would (it throws on `value=""`).
 */

function PlateRow({
  glyph,
  title,
  sub,
  muted,
  children,
}: {
  glyph: ReactNode
  title: string
  sub: string
  muted?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-[60px] items-center gap-3 rounded-xl p-3',
        // The picker itself is invisible, so the ROW carries its focus state —
        // otherwise a keyboard user lands on a control with no visible focus.
        'focus-within:ring-1 focus-within:ring-inset focus-within:ring-[var(--color-highlight-bright)]',
        muted ? 'opacity-60' : undefined,
      )}
    >
      {glyph}
      <span className="min-w-0 flex-1">
        <span className="anvl-heading block truncate text-sm text-[var(--color-heading)]">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[var(--color-text-muted)]">
          {sub}
        </span>
      </span>
      {children}
    </div>
  )
}

/** The full-bleed native picker + the chevron that advertises it. */
function RowPicker({
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  label: string
  value: string
  disabled?: boolean
  onChange: (next: string) => void
  children: ReactNode
}) {
  return (
    <>
      <ChevronDown
        size={ICON_SIZE.sm}
        aria-hidden="true"
        className="shrink-0 text-[var(--color-text-muted)]"
      />
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring absolute inset-0 h-full w-full cursor-pointer rounded-xl opacity-0"
      >
        {children}
      </select>
    </>
  )
}

export function ShareOnImagePlate({
  context,
  pieces,
  pieceSlug,
  onPieceChange,
  allowPiecePicker,
  feats,
  featId,
  onFeatChange,
}: {
  context: ShareContext
  pieces: SharePiece[]
  pieceSlug: string | null
  onPieceChange: (slug: string | null) => void
  allowPiecePicker: boolean
  feats: ShareFeat[]
  featId: string | null
  onFeatChange: (id: string | null) => void
}) {
  const piece = context.piece
  const feat = context.feat
  const noFeats = feats.length === 0

  return (
    <div className="mt-5">
      <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">On the image</p>

      <div
        className={cn(
          'mt-2 divide-y divide-[var(--color-line)] rounded-xl',
          'bg-[var(--color-surface-elevated)] ring-1 ring-inset ring-[var(--color-line)]',
        )}
      >
        <PlateRow
          glyph={
            piece?.imageUrl ? (
              <img
                src={piece.imageUrl}
                alt=""
                aria-hidden="true"
                className="h-12 w-10 shrink-0 rounded-md object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-12 w-10 shrink-0 place-items-center rounded-md bg-[var(--color-chip)] text-[var(--color-text-muted)]"
              >
                <Shirt size={ICON_SIZE.md} />
              </span>
            )
          }
          title={piece?.name ?? 'My armory'}
          sub={piece ? `${piece.wearCount} wears logged` : context.owner.rankTitle}
        >
          {allowPiecePicker ? (
            <RowPicker
              label="The piece"
              value={pieceSlug ?? ''}
              onChange={(next) => onPieceChange(next || null)}
            >
              <option value="">My armory — {context.owner.rankTitle}</option>
              {pieces.map((entry) => (
                <option key={entry.slug} value={entry.slug}>
                  {entry.name}
                </option>
              ))}
            </RowPicker>
          ) : null}
        </PlateRow>

        <PlateRow
          muted={noFeats}
          glyph={
            <span
              aria-hidden="true"
              className={cn(
                'grid h-12 w-10 shrink-0 place-items-center rounded-md bg-[var(--color-chip)]',
                feat ? 'text-[var(--color-highlight-bright)]' : 'text-[var(--color-text-muted)]',
              )}
            >
              {feat ? <Trophy size={ICON_SIZE.md} /> : <Star size={ICON_SIZE.md} />}
            </span>
          }
          title={feat?.title ?? (noFeats ? 'No feats logged yet' : 'Add a feat')}
          sub={
            feat
              ? featDate(feat.achievedOn)
              : noFeats
                ? 'Log one in your armory to add it here'
                : `${feats.length} logged on this piece`
          }
        >
          <RowPicker
            label="Add a feat"
            value={featId ?? ''}
            disabled={noFeats}
            onChange={(next) => onFeatChange(next || null)}
          >
            <option value="">{noFeats ? 'No feats logged yet' : 'No feat'}</option>
            {feats.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </RowPicker>
        </PlateRow>
      </div>
    </div>
  )
}
