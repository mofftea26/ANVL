import { useMemo, useState } from 'react'
import { Flame, Medal, Search, Star, Trophy } from '@/shared/icons'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import { Input, Select, SelectItem } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'
import { deriveArmoryRank } from '../lib/ranks'
import type { PublicArmory } from '../schemas/passport.schema'
import { ArmoryTcgCard, type ArmoryProductMeta } from './ArmoryTcgCard'

const ROMAN = ['I', 'II', 'III'] as const

/** Bevel-cut plate — the forged-plate language shared with the toasts. */
const PLATE_CLIP =
  '[clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]'

/**
 * The read-only face of an athlete's Armory — what a visitor sees at
 * /armory/$handle. One identity card leads (rank, record numbers, fun stats),
 * the Hall of Honor stands on lit pedestals, and the collection deals every
 * piece as a flippable trading card carrying its own service record. Renders
 * only what the owner made public — never tokens, serials or ids (the RPC
 * already stripped them).
 */
export function PublicArmoryView({
  armory,
  images,
  names = {},
  meta = {},
}: {
  armory: PublicArmory
  images: Record<string, string | undefined>
  /** slug → product name (catalog-resolved for feats on non-public pieces). */
  names?: Record<string, string | undefined>
  /** slug → catalog facts (category/drop/price/fabric…) for filters + detail modals. */
  meta?: Record<string, ArmoryProductMeta | undefined>
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [drop, setDrop] = useState('all')
  // Rank from the true total (completion needs the catalog cross-reference we
  // don't expose publicly, so this never overstates — Warlord bonuses aside).
  const rank = deriveArmoryRank(armory.totalPieces, [])
  const honored = armory.pieces
    .filter((p) => p.featuredSlot)
    .sort((a, b) => (a.featuredSlot ?? 9) - (b.featuredSlot ?? 9))
    .slice(0, 3)
  const totalWears = armory.pieces.reduce((sum, p) => sum + p.wearCount, 0)

  // Fun stats — most-worn piece and how long this armory has been in service.
  const mostWorn = armory.pieces.reduce<PublicArmory['pieces'][number] | null>(
    (best, p) => (p.wearCount > 0 && p.wearCount > (best?.wearCount ?? 0) ? p : best),
    null,
  )
  const earliestClaim = armory.pieces.reduce<number | null>((min, p) => {
    if (!p.claimedAt) return min
    const t = new Date(p.claimedAt).getTime()
    return Number.isFinite(t) && (min === null || t < min) ? t : min
  }, null)
  const daysInService =
    earliestClaim != null
      ? Math.max(1, Math.floor((Date.now() - earliestClaim) / 86_400_000))
      : null

  // Feats grouped under their piece; the rest form the standalone war record.
  const featsBySlug = new Map<string, typeof armory.feats>()
  const looseFeats: typeof armory.feats = []
  const shownSlugs = new Set(armory.pieces.map((p) => p.productSlug))
  for (const feat of armory.feats) {
    if (feat.productSlug && shownSlugs.has(feat.productSlug)) {
      const list = featsBySlug.get(feat.productSlug) ?? []
      list.push(feat)
      featsBySlug.set(feat.productSlug, list)
    } else {
      looseFeats.push(feat)
    }
  }

  // Filter options grow from whatever the owner's pieces actually are.
  const categoryOptions = useMemo(
    () =>
      [...new Set(armory.pieces.map((p) => meta[p.productSlug]?.category).filter(Boolean))] as string[],
    [armory.pieces, meta],
  )
  const dropOptions = useMemo(
    () =>
      [...new Set(armory.pieces.map((p) => meta[p.productSlug]?.dropName).filter(Boolean))] as string[],
    [armory.pieces, meta],
  )
  const visiblePieces = armory.pieces.filter((p) => {
    if (query && !p.productName.toLowerCase().includes(query.trim().toLowerCase())) return false
    if (category !== 'all' && meta[p.productSlug]?.category !== category) return false
    if (drop !== 'all' && meta[p.productSlug]?.dropName !== drop) return false
    return true
  })

  const funStats = [
    daysInService != null
      ? `${daysInService} ${daysInService === 1 ? 'day' : 'days'} in service`
      : null,
    mostWorn ? `Most worn: ${mostWorn.productName} · ${mostWorn.wearCount}` : null,
    honored.length > 0 ? `Honors held: ${honored.length}/3` : null,
  ].filter((s): s is string => s != null)

  return (
    <div className="relative">
      {/* The hall — one continuous ember-lit backdrop behind everything. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 45% at 50% 0%, color-mix(in srgb, var(--color-highlight) 7%, transparent) 0%, transparent 60%), radial-gradient(140% 50% at 50% 108%, color-mix(in srgb, var(--color-highlight) 8%, transparent) 0%, transparent 60%)',
          }}
        />
        <GrainOverlay intensity="subtle" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* The identity card ---------------------------------------------- */}
        <RevealOnScroll>
          <header
            className={cn(
              'relative overflow-hidden [filter:drop-shadow(0_14px_30px_rgba(0,0,0,0.5))]',
            )}
          >
            <div
              className={cn('relative px-5 py-6 sm:px-8 sm:py-8', PLATE_CLIP)}
              style={{
                background:
                  'linear-gradient(160deg, color-mix(in oklab, var(--color-highlight) 10%, var(--color-surface-elevated)) 0%, var(--color-surface) 52%, color-mix(in oklab, var(--color-bg) 86%, black) 100%)',
              }}
            >
              {/* Heat hairline along the top edge. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,var(--color-highlight-bright)_30%,color-mix(in_srgb,var(--color-highlight)_60%,transparent)_70%,transparent_100%)]"
              />
              {/* Ghost inscription behind the record numbers. */}
              <span
                aria-hidden="true"
                className="anvl-heading pointer-events-none absolute -bottom-6 right-0 select-none text-8xl leading-none text-[color-mix(in_srgb,var(--color-heading)_5%,transparent)]"
              >
                ARMORY
              </span>

              <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:gap-8 md:text-left">
                {/* The emblem on its lit disc. */}
                <div className="relative shrink-0">
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, color-mix(in srgb, var(--color-highlight) 22%, transparent) 0%, transparent 70%)',
                    }}
                  />
                  <img
                    src={rank.emblemSrc}
                    alt={`${rank.title} rank emblem`}
                    width={120}
                    height={120}
                    decoding="async"
                    className="relative h-24 w-24 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
                  />
                </div>

                {/* The athlete. */}
                <div className="min-w-0 md:flex-1">
                  <p className="anvl-micro text-[var(--color-highlight-bright)]">The Armory of</p>
                  <h1 className="anvl-heading mt-1 text-3xl leading-none text-[var(--color-heading)] sm:text-4xl">
                    {armory.ownerName}
                  </h1>
                  <p className="mt-2 flex items-center justify-center gap-2 md:justify-start">
                    <span className="anvl-micro text-[10px] uppercase tracking-[0.2em] text-[var(--color-highlight-bright)]">
                      {rank.title}
                    </span>
                    {/* Level pips — I · II · III within the rank. */}
                    <span className="flex items-center gap-1" aria-hidden="true">
                      {[1, 2, 3].map((level) => (
                        <span
                          key={level}
                          className="h-1.5 w-1.5 rotate-45 border border-[var(--color-highlight)]"
                          style={{
                            backgroundColor:
                              level <= rank.level ? 'var(--color-highlight)' : 'transparent',
                          }}
                        />
                      ))}
                    </span>
                  </p>
                  {funStats.length > 0 ? (
                    <p
                      className="anvl-micro mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] text-[var(--color-text-muted)] md:justify-start"
                      suppressHydrationWarning
                    >
                      {funStats.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className="h-1 w-1 rotate-45 bg-[var(--color-highlight)]/70"
                          />
                          {s}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>

                {/* The record numbers. */}
                <dl className="grid shrink-0 grid-cols-3 gap-6 border-t border-[color-mix(in_oklab,var(--color-line)_70%,transparent)] pt-5 md:self-start md:border-l md:border-t-0 md:pl-8 md:pt-1">
                  {(
                    [
                      [String(armory.totalPieces), armory.totalPieces === 1 ? 'Piece forged' : 'Pieces forged'],
                      [String(totalWears), 'Wears logged'],
                      [String(armory.feats.length), armory.feats.length === 1 ? 'Feat' : 'Feats'],
                    ] as const
                  ).map(([value, label]) => (
                    <div key={label} className="flex flex-col items-center gap-1 md:items-start">
                      <dt className="sr-only">{label}</dt>
                      <dd className="anvl-heading text-3xl leading-none text-[var(--color-heading)]">
                        {value}
                      </dd>
                      <dd className="anvl-micro text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                        {label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </header>
        </RevealOnScroll>

        {/* Hall of Honor — three lit pedestals ----------------------------- */}
        {honored.length > 0 ? (
          <section className="mt-16">
            <RevealOnScroll>
              <div className="mb-8 flex items-center justify-center gap-3">
                <span aria-hidden="true" className="h-px w-10 bg-[linear-gradient(90deg,transparent,var(--color-highlight))]" />
                <Medal size={15} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                <h2 className="anvl-micro text-[10px] uppercase tracking-[0.26em] text-[var(--color-highlight-bright)]">
                  Hall of Honor
                </h2>
                <span aria-hidden="true" className="h-px w-10 bg-[linear-gradient(270deg,transparent,var(--color-highlight))]" />
              </div>
            </RevealOnScroll>

            <div
              className={cn(
                'mx-auto grid items-end gap-8 sm:gap-6',
                honored.length === 1
                  ? 'max-w-[13rem] grid-cols-1'
                  : honored.length === 2
                    ? 'max-w-md grid-cols-2'
                    : 'max-w-2xl grid-cols-1 sm:grid-cols-3',
              )}
            >
              {honored.map((piece, i) => (
                <RevealOnScroll key={piece.featuredSlot}>
                  <figure className="group relative flex flex-col items-center text-center">
                    {/* The piece, floating over its light pool. */}
                    <div className="relative motion-safe:transition-transform motion-safe:duration-300 group-hover:-translate-y-1.5">
                      {images[piece.productSlug] ? (
                        <img
                          src={images[piece.productSlug]}
                          alt={piece.productName}
                          loading="lazy"
                          decoding="async"
                          width={224}
                          height={280}
                          className="relative h-44 w-36 object-cover [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] [filter:drop-shadow(0_18px_30px_rgba(0,0,0,0.6))]"
                        />
                      ) : (
                        <div className="grid h-44 w-36 place-items-center bg-[var(--color-surface-elevated)] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                          <Star size={22} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                        </div>
                      )}
                    </div>

                    {/* The light pool the piece floats over. */}
                    <span
                      aria-hidden="true"
                      className="-mt-2 h-4 w-40 rounded-[100%]"
                      style={{
                        background:
                          'radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--color-highlight) 35%, transparent) 0%, transparent 70%)',
                      }}
                    />

                    <figcaption className="mt-3">
                      <p className="anvl-micro text-[8px] uppercase tracking-[0.2em] text-[color-mix(in_oklab,var(--color-highlight-bright)_80%,transparent)]">
                        Honor {ROMAN[i] ?? ''}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-[var(--color-heading)]">
                        {piece.productName}
                      </p>
                      {piece.wearCount > 0 ? (
                        <p className="anvl-micro mt-1 flex items-center justify-center gap-1 text-[9px] text-[var(--color-text-muted)]">
                          <Flame
                            size={10}
                            aria-hidden="true"
                            className="text-[var(--color-highlight-bright)]"
                          />
                          {piece.wearCount} {piece.wearCount === 1 ? 'wear' : 'wears'}
                        </p>
                      ) : null}
                    </figcaption>
                  </figure>
                </RevealOnScroll>
              ))}
            </div>
          </section>
        ) : null}

        {/* The Collection — every piece dealt as a trading card ------------ */}
        {armory.pieces.length > 0 ? (
          <section className="mt-16">
            <RevealOnScroll>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="anvl-heading text-2xl leading-none text-[var(--color-heading)]">
                  The Collection
                </h2>
                <p className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
                  Click a card to read its record
                </p>
              </div>
            </RevealOnScroll>

            {/* The armory index — search + category/drop, grown from the pieces. */}
            <RevealOnScroll>
              <div className="mb-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the collection…"
                    aria-label="Search the collection"
                    className="pl-9"
                  />
                </div>
                {categoryOptions.length > 0 ? (
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    aria-label="Filter by category"
                    className="sm:w-44"
                  >
                    <SelectItem value="all">All categories</SelectItem>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </Select>
                ) : null}
                {dropOptions.length > 0 ? (
                  <Select
                    value={drop}
                    onValueChange={setDrop}
                    aria-label="Filter by drop"
                    className="sm:w-44"
                  >
                    <SelectItem value="all">All drops</SelectItem>
                    {dropOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </Select>
                ) : null}
              </div>
            </RevealOnScroll>

            {visiblePieces.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3">
                {visiblePieces.map((piece, i) => (
                  <div
                    key={`${piece.productSlug}-${i}`}
                    className="mx-auto w-full max-w-[320px] min-[480px]:max-w-none"
                  >
                    <RevealOnScroll>
                      <ArmoryTcgCard
                        piece={piece}
                        feats={featsBySlug.get(piece.productSlug) ?? []}
                        image={images[piece.productSlug]}
                        meta={meta[piece.productSlug]}
                      />
                    </RevealOnScroll>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                No pieces match the filters.
              </p>
            )}
          </section>
        ) : (
          <p className="mt-10 text-center text-sm text-[var(--color-text-muted)]">
            No pieces shared yet.
          </p>
        )}

        {/* Feats not tied to a shared piece — the war record --------------- */}
        {looseFeats.length > 0 ? (
          <section className="mt-16">
            <RevealOnScroll>
              <div className="mb-4 flex items-center gap-2">
                <Trophy size={17} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                <h2 className="anvl-heading text-lg text-[var(--color-heading)]">More feats</h2>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <ul className="space-y-2">
                {looseFeats.map((feat, i) => (
                  <li
                    key={`${feat.title}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] px-4 py-3"
                  >
                    <span className="min-w-0 text-sm font-semibold text-[var(--color-heading)]">
                      {feat.title}
                      {feat.productSlug && names[feat.productSlug] ? (
                        <span className="anvl-micro ml-2 text-[9px] text-[var(--color-text-muted)]">
                          wearing {names[feat.productSlug]}
                        </span>
                      ) : null}
                    </span>
                    <span className="anvl-micro shrink-0 text-[10px] text-[var(--color-text-muted)]">
                      {new Date(feat.achievedOn).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </RevealOnScroll>
          </section>
        ) : null}
      </div>
    </div>
  )
}

/** Shown when a handle is unknown, or its owner turned sharing off. */
export function PublicArmoryMissing() {
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <Star size={28} aria-hidden="true" className="text-[var(--color-text-muted)]" />
      <h1 className="anvl-heading text-2xl text-[var(--color-heading)]">Armory not found</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        This armory is private or the link is no longer active.
      </p>
    </div>
  )
}
