import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Calendar, Flame, RotateCcw, Shirt, ShoppingBag, Trophy } from '@/shared/icons'
import { Modal } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import type { PublicArmory } from '../schemas/passport.schema'

type ArmoryPiece = PublicArmory['pieces'][number]
type ArmoryPublicFeat = PublicArmory['feats'][number]

/** Catalog-resolved product facts for the detail modal (loader-supplied —
 *  public armory payloads carry slugs only). */
export interface ArmoryProductMeta {
  category?: string
  dropName?: string
  price?: number
  currency?: string
  fit?: string
  fabric?: string
  gsm?: string
}

/** TCG bevel — the card's octagonal cut (applied per face; a clip on the 3D
 *  wrapper would flatten the flip). */
const CARD_CLIP =
  '[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]'

/**
 * A piece's "temper" — the card's rarity tier, earned by wearing it. Drives
 * the frame's heat (how much champagne bleeds into the steel) so a battle-worn
 * card visibly outranks fresh steel, TCG-foil style.
 */
function wearTemper(wearCount: number): { label: string; framePct: number } {
  if (wearCount >= 25) return { label: 'Relic', framePct: 80 }
  if (wearCount >= 10) return { label: 'Battle-forged', framePct: 55 }
  if (wearCount >= 1) return { label: 'Tempered', framePct: 32 }
  return { label: 'Fresh steel', framePct: 16 }
}

/**
 * One collection piece as a trading card. Front: full-art with a name plate
 * and the piece's record line — click flips it (3D, reduced-motion snaps).
 * Back: the service record (stats + latest three feats), a "Show all" door to
 * the full product-detail modal, a shop link on the piece, and clicking the
 * card anywhere flips it back. Read-only — this is the visitor's view.
 */
export function ArmoryTcgCard({
  piece,
  feats,
  image,
  meta,
}: {
  piece: ArmoryPiece
  /** Feats logged on this piece (already filtered by slug). */
  feats: ArmoryPublicFeat[]
  image?: string
  meta?: ArmoryProductMeta
}) {
  const [flipped, setFlipped] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const temper = wearTemper(piece.wearCount)
  const frame = `color-mix(in srgb, var(--color-highlight) ${temper.framePct}%, var(--color-line))`
  const sortedFeats = [...feats].sort((a, b) => b.achievedOn.localeCompare(a.achievedOn))
  const latestFeats = sortedFeats.slice(0, 3)
  const fit = [piece.claimedColor, piece.claimedSize].filter(Boolean).join(' / ')
  const daysInService = piece.claimedAt
    ? Math.max(1, Math.floor((Date.now() - new Date(piece.claimedAt).getTime()) / 86_400_000))
    : null

  return (
    <div className="group relative aspect-[5/7] [perspective:1400px] motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-1.5">
      <div
        className={cn(
          'relative h-full w-full [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-700 motion-safe:[transition-timing-function:cubic-bezier(0.2,0.85,0.25,1)]',
          flipped && '[transform:rotateY(180deg)]',
        )}
      >
        {/* FRONT — full-art face -------------------------------------------- */}
        <div
          inert={flipped}
          aria-hidden={flipped}
          className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.5))]"
        >
          <button
            type="button"
            onClick={() => setFlipped(true)}
            aria-label={`Flip to see the record of ${piece.productName}`}
            className={cn(
              'focus-ring relative block h-full w-full cursor-pointer overflow-hidden text-left',
              CARD_CLIP,
            )}
            style={{
              background:
                'linear-gradient(165deg, var(--color-surface-elevated) 0%, var(--color-surface) 45%, color-mix(in oklab, var(--color-bg) 85%, black) 100%)',
            }}
          >
            {/* The frame — temper-heated double border. */}
            <span
              aria-hidden="true"
              className={cn('pointer-events-none absolute inset-0 border-2', CARD_CLIP)}
              style={{ borderColor: frame }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[7px] border [clip-path:polygon(9px_0,calc(100%-9px)_0,100%_9px,100%_calc(100%-9px),calc(100%-9px)_100%,9px_100%,0_calc(100%-9px),0_9px)]"
              style={{ borderColor: `color-mix(in srgb, ${frame} 55%, transparent)` }}
            />

            {/* The art. */}
            {image ? (
              <img
                src={image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                width={420}
                height={588}
                className="absolute inset-[10px] h-[calc(100%-20px)] w-[calc(100%-20px)] object-cover motion-safe:transition-transform motion-safe:duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <span className="absolute inset-[10px] grid place-items-center bg-[var(--color-surface-elevated)]">
                <Shirt size={40} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
              </span>
            )}
            {/* Legibility wash behind the plates. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[10px]"
              style={{
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 72%, transparent) 0%, transparent 22%, transparent 58%, color-mix(in srgb, var(--color-bg) 88%, transparent) 92%)',
              }}
            />
            {/* Holo sweep on hover. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-[linear-gradient(105deg,transparent_42%,color-mix(in_srgb,var(--color-heading)_14%,transparent)_50%,transparent_58%)] motion-safe:transition-transform motion-safe:duration-700 group-hover:translate-x-[130%] motion-reduce:hidden"
            />

            {/* Name plate. */}
            <span className="absolute inset-x-[10px] top-[10px] block px-3.5 pt-3">
              <span className="anvl-heading block truncate text-lg leading-tight text-[var(--color-heading)] [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                {piece.productName}
              </span>
              {fit ? (
                <span className="anvl-micro mt-0.5 block text-[9px] text-[color-mix(in_srgb,var(--color-heading)_75%,transparent)]">
                  {fit}
                </span>
              ) : null}
            </span>

            {/* Record line + temper stamp. */}
            <span className="absolute inset-x-[10px] bottom-[10px] flex items-end justify-between gap-2 px-3.5 pb-3">
              <span className="min-w-0">
                <span
                  className="anvl-micro block text-[9px]"
                  style={{ color: `color-mix(in srgb, var(--color-highlight-bright) 85%, transparent)` }}
                >
                  {temper.label}
                </span>
                <span className="mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-heading)]">
                    <Flame size={12} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                    {piece.wearCount}
                  </span>
                  {feats.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-heading)]">
                      <Trophy size={12} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                      {feats.length}
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="anvl-micro inline-flex shrink-0 items-center gap-1 text-[8px] text-[var(--color-text-muted)] opacity-0 motion-safe:transition-opacity group-hover:opacity-100">
                <RotateCcw size={10} aria-hidden="true" />
                Flip
              </span>
            </span>
          </button>
        </div>

        {/* BACK — the service record (click anywhere to flip back) ---------- */}
        <div
          inert={!flipped}
          aria-hidden={!flipped}
          className={cn(
            'absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.5))]',
            !flipped && 'pointer-events-none',
          )}
        >
          {/* Surface click is a pointer convenience only — the sr-only button
              below is the keyboard/AT path for the same action. */}
          <div
            onClick={() => setFlipped(false)}
            className={cn(
              'relative flex h-full w-full cursor-pointer flex-col overflow-hidden p-4',
              CARD_CLIP,
            )}
            style={{
              background:
                'linear-gradient(165deg, var(--color-surface-elevated) 0%, var(--color-surface) 40%, color-mix(in oklab, var(--color-bg) 88%, black) 100%)',
            }}
          >
            {/* Keyboard/AT path for the whole-surface flip-back. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFlipped(false)
              }}
              className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-10 focus:rounded focus:bg-[var(--color-surface-elevated)] focus:px-2 focus:py-1 focus:text-[10px]"
            >
              Flip back to the card art
            </button>

            <span
              aria-hidden="true"
              className={cn('pointer-events-none absolute inset-0 border-2', CARD_CLIP)}
              style={{ borderColor: frame }}
            />
            {/* Watermark. */}
            <span
              aria-hidden="true"
              className="anvl-heading pointer-events-none absolute -bottom-3 right-2 select-none text-7xl leading-none text-[color-mix(in_srgb,var(--color-heading)_6%,transparent)]"
            >
              ANVL
            </span>

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="anvl-micro text-[8px] text-[var(--color-highlight-bright)]">
                  Service record
                </p>
                <p className="anvl-heading mt-0.5 truncate text-base leading-tight text-[var(--color-heading)]">
                  {piece.productName}
                </p>
              </div>
              <Link
                to="/shop/$slug"
                params={{ slug: piece.productSlug }}
                onClick={(e) => e.stopPropagation()}
                aria-label={`View ${piece.productName} in the shop`}
                className="focus-ring -mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-heading)]"
              >
                <ShoppingBag size={ICON_SIZE.sm} aria-hidden="true" />
              </Link>
            </div>

            <dl className="mt-3 space-y-2 border-t border-[color-mix(in_oklab,var(--color-line)_70%,transparent)] pt-3">
              {(
                [
                  [Flame, 'Wears logged', String(piece.wearCount)],
                  daysInService != null
                    ? ([Calendar, 'Days in service', String(daysInService)] as const)
                    : null,
                  fit ? ([Shirt, 'Fit', fit] as const) : null,
                ] as const
              )
                .filter((row): row is NonNullable<typeof row> => row != null)
                .map(([Icon, label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <dt className="anvl-micro flex items-center gap-1.5 text-[9px]">
                      <Icon size={12} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                      {label}
                    </dt>
                    <dd
                      className="truncate text-xs font-semibold text-[var(--color-heading)]"
                      suppressHydrationWarning
                    >
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>

            {/* Latest feats + the door to the full record. */}
            <div className="mt-3 min-h-0 flex-1 border-t border-[color-mix(in_oklab,var(--color-line)_70%,transparent)] pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="anvl-micro text-[8px] text-[var(--color-highlight-bright)]">
                  Latest feats
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDetailOpen(true)
                  }}
                  className="focus-ring anvl-micro -my-1 rounded px-1.5 py-1 text-[8px] text-[var(--color-text)] underline decoration-[var(--color-highlight)]/60 underline-offset-2 transition-colors hover:text-[var(--color-heading)]"
                >
                  Show all
                </button>
              </div>
              {latestFeats.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {latestFeats.map((feat, i) => (
                    <li
                      key={`${feat.title}-${i}`}
                      className="flex items-start gap-1.5 text-[11px] leading-snug text-[var(--color-text)]"
                    >
                      <Trophy
                        size={12}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[var(--color-highlight-bright)]"
                      />
                      <span className="min-w-0">
                        {feat.title}
                        <span className="anvl-micro ml-1 text-[8px] text-[var(--color-text-muted)]">
                          {new Date(feat.achievedOn).toLocaleDateString()}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                  No feats logged on this piece yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* The full record — every product detail plus every feat. */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={piece.productName}>
        <div className="max-h-[64svh] space-y-5 overflow-y-auto pr-1">
          <div className="flex items-start gap-4">
            {image ? (
              <img
                src={image}
                alt={piece.productName}
                loading="lazy"
                decoding="async"
                width={112}
                height={140}
                className="h-28 w-[88px] shrink-0 rounded-md object-cover"
              />
            ) : null}
            <div className="min-w-0 space-y-1.5">
              <p className="anvl-micro text-[9px] text-[var(--color-highlight-bright)]">
                {temper.label}
              </p>
              {(
                [
                  ['Drop', meta?.dropName],
                  ['Category', meta?.category],
                  [
                    'Price',
                    meta?.price != null
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: meta.currency || 'USD',
                        }).format(meta.price)
                      : undefined,
                  ],
                  ['Cut', meta?.fit],
                  ['Fabric', meta?.fabric],
                  ['Weight', meta?.gsm],
                ] as const
              )
                .filter(([, v]) => Boolean(v))
                .map(([label, value]) => (
                  <p key={label} className="flex items-baseline gap-2 text-xs">
                    <span className="anvl-micro w-16 shrink-0 text-[9px]">{label}</span>
                    <span className="min-w-0 font-semibold text-[var(--color-heading)]">
                      {value}
                    </span>
                  </p>
                ))}
            </div>
          </div>

          {/* The owner's record on this piece. */}
          <div>
            <p className="anvl-micro mb-2 text-[9px] text-[var(--color-highlight-bright)]">
              Service record
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-[var(--color-surface-elevated)] p-3 sm:grid-cols-4">
              {(
                [
                  ['Wears', String(piece.wearCount)],
                  daysInService != null ? (['Days in service', String(daysInService)] as const) : null,
                  fit ? (['Fit', fit] as const) : null,
                  piece.claimedAt
                    ? (['Claimed', new Date(piece.claimedAt).toLocaleDateString()] as const)
                    : null,
                ] as const
              )
                .filter((row): row is NonNullable<typeof row> => row != null)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="anvl-micro text-[8px]">{label}</dt>
                    <dd
                      className="mt-0.5 text-sm font-semibold text-[var(--color-heading)]"
                      suppressHydrationWarning
                    >
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Every feat. */}
          <div>
            <p className="anvl-micro mb-2 text-[9px] text-[var(--color-highlight-bright)]">
              Feats · {sortedFeats.length}
            </p>
            {sortedFeats.length > 0 ? (
              <ul className="space-y-2">
                {sortedFeats.map((feat, i) => (
                  <li
                    key={`${feat.title}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-surface-elevated)] px-3.5 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
                      <Trophy
                        size={14}
                        aria-hidden="true"
                        className="shrink-0 text-[var(--color-highlight-bright)]"
                      />
                      <span className="min-w-0">{feat.title}</span>
                    </span>
                    <span className="anvl-micro shrink-0 text-[10px] text-[var(--color-text-muted)]">
                      {new Date(feat.achievedOn).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">
                No feats logged on this piece yet.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
