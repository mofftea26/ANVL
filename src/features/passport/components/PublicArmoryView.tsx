import { Flame, Star, Trophy } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import { deriveArmoryRank } from '../lib/ranks'
import type { PublicArmory } from '../schemas/passport.schema'

const ROMAN = ['I', 'II', 'III'] as const

/**
 * The read-only face of an athlete's Armory — what a visitor sees at
 * /armory/$handle. The athlete leads (rank, record numbers), the Hall of
 * Honor stands on LIT PEDESTALS, and every collection piece carries its own
 * wear count and public feats. Renders only what the owner made public —
 * never tokens, serials or ids (the RPC already stripped them).
 */
export function PublicArmoryView({
  armory,
  images,
  names = {},
}: {
  armory: PublicArmory
  images: Record<string, string | undefined>
  /** slug → product name (catalog-resolved for feats on non-public pieces). */
  names?: Record<string, string | undefined>
}) {
  // Rank from the true total (completion needs the catalog cross-reference we
  // don't expose publicly, so this never overstates — Warlord bonuses aside).
  const rank = deriveArmoryRank(armory.totalPieces, [])
  const honored = armory.pieces
    .filter((p) => p.featuredSlot)
    .sort((a, b) => (a.featuredSlot ?? 9) - (b.featuredSlot ?? 9))
    .slice(0, 3)
  const totalWears = armory.pieces.reduce((sum, p) => sum + p.wearCount, 0)

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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* The athlete ---------------------------------------------------- */}
      <header className="flex flex-col items-center gap-4 text-center">
        <img
          src={rank.emblemSrc}
          alt={`${rank.title} rank emblem`}
          width={120}
          height={120}
          decoding="async"
          className="h-20 w-20 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
        />
        <div>
          <p className="anvl-micro text-[var(--color-highlight-bright)]">The Armory of</p>
          <h1 className="anvl-heading text-3xl text-[var(--color-heading)] sm:text-4xl">
            {armory.ownerName}
          </h1>
          <p className="mt-1 anvl-micro text-[10px] uppercase tracking-[0.2em] text-[var(--color-highlight-bright)]">
            {rank.title}
          </p>
        </div>

        {/* The record numbers, front and centre. */}
        <dl className="mt-2 grid w-full max-w-md grid-cols-3 overflow-hidden rounded-2xl bg-[var(--color-surface)]">
          {(
            [
              [String(armory.totalPieces), armory.totalPieces === 1 ? 'Piece forged' : 'Pieces forged'],
              [String(totalWears), 'Wears logged'],
              [String(armory.feats.length), armory.feats.length === 1 ? 'Feat' : 'Feats'],
            ] as const
          ).map(([value, label], i) => (
            <div
              key={label}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-4',
                i > 0 && 'border-l border-[color-mix(in_oklab,var(--color-line)_70%,transparent)]',
              )}
            >
              <dt className="sr-only">{label}</dt>
              <dd className="anvl-heading text-2xl leading-none text-[var(--color-heading)]">
                {value}
              </dd>
              <dd className="anvl-micro text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Hall of Honor — pieces standing on lit pedestals ---------------- */}
      {honored.length > 0 ? (
        <section className="mt-12">
          <div className="mb-8 flex items-center justify-center gap-2">
            <Star
              size={15}
              aria-hidden="true"
              className="fill-[var(--color-highlight-bright)] text-[var(--color-highlight-bright)]"
            />
            <h2 className="anvl-heading text-lg text-[var(--color-heading)]">Hall of Honor</h2>
          </div>

          <div
            className={cn(
              'mx-auto grid max-w-2xl items-end gap-6',
              honored.length === 1 ? 'grid-cols-1' : honored.length === 2 ? 'grid-cols-2' : 'grid-cols-3',
            )}
          >
            {honored.map((piece, i) => (
              <figure key={piece.featuredSlot} className="group relative flex flex-col items-center">
                {/* Spotlight cone from above. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 left-1/2 h-[130%] w-[150%] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,color-mix(in_oklab,var(--color-highlight)_16%,transparent)_0%,transparent_70%)]"
                />

                {/* The piece — floating above its pedestal. */}
                <div className="relative z-10 w-[72%] motion-safe:transition-transform motion-safe:duration-500 group-hover:-translate-y-1.5">
                  {images[piece.productSlug] ? (
                    <img
                      src={images[piece.productSlug]}
                      alt={piece.productName}
                      loading="lazy"
                      decoding="async"
                      width={280}
                      height={350}
                      className="aspect-[4/5] w-full rounded-lg object-cover shadow-[0_28px_50px_-18px_rgba(0,0,0,0.85)]"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-[var(--color-surface-elevated)]">
                      <Star size={20} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                    </div>
                  )}
                  {/* Faint floor reflection. */}
                  <img
                    src={images[piece.productSlug] ?? ''}
                    alt=""
                    aria-hidden="true"
                    className={cn(
                      'absolute left-0 top-full mt-0.5 aspect-[4/5] w-full -scale-y-100 rounded-lg object-cover opacity-15 [mask-image:linear-gradient(180deg,transparent_55%,black_100%)]',
                      !images[piece.productSlug] && 'hidden',
                    )}
                  />
                </div>

                {/* The pedestal: top face + front face + light pool. */}
                <div aria-hidden="true" className="relative z-0 -mt-2 w-full">
                  {/* Top face (perspective-squashed). */}
                  <div className="mx-auto h-3 w-[86%] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-highlight)_20%,var(--color-surface-elevated))_0%,var(--color-surface-elevated)_100%)] [clip-path:polygon(7%_0,93%_0,100%_100%,0_100%)]" />
                  {/* Front face with engraved numeral. */}
                  <div className="relative mx-auto flex h-16 w-full items-center justify-center bg-[linear-gradient(180deg,var(--color-surface-elevated)_0%,color-mix(in_oklab,var(--color-bg)_88%,black)_100%)] [clip-path:polygon(0_0,100%_0,94%_100%,6%_100%)]">
                    <span className="anvl-heading text-2xl tracking-[0.3em] text-[color-mix(in_oklab,var(--color-highlight-bright)_75%,transparent)] [text-shadow:0_1px_0_rgba(0,0,0,0.8),0_-1px_0_rgba(255,255,255,0.08)]">
                      {ROMAN[i] ?? ''}
                    </span>
                    {/* Hairline edge light. */}
                    <span className="absolute inset-x-[6%] top-0 h-px bg-[color-mix(in_oklab,var(--color-highlight)_40%,transparent)]" />
                  </div>
                  {/* Light pool on the floor. */}
                  <div className="mx-auto -mt-1 h-4 w-[110%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-highlight)_22%,transparent)_0%,transparent_70%)] blur-[2px]" />
                </div>

                <figcaption className="z-10 mt-2 line-clamp-2 max-w-[90%] text-center text-[11px] font-semibold leading-tight text-[var(--color-heading)]">
                  {piece.productName}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* The Collection — every piece with its record ------------------- */}
      {armory.pieces.length > 0 ? (
        <section className="mt-14">
          <h2 className="anvl-heading mb-3 text-lg text-[var(--color-heading)]">The Collection</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {armory.pieces.map((piece, i) => {
              const pieceFeats = featsBySlug.get(piece.productSlug) ?? []
              return (
                <div
                  key={`${piece.productSlug}-${i}`}
                  className="flex flex-col rounded-xl bg-[var(--color-surface)] p-3"
                >
                  {images[piece.productSlug] ? (
                    <img
                      src={images[piece.productSlug]}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      width={300}
                      height={380}
                      className="mb-2 aspect-[3/4] w-full rounded-md object-cover"
                    />
                  ) : null}
                  <p className="truncate text-xs font-semibold text-[var(--color-heading)]">
                    {piece.productName}
                  </p>
                  <p className="anvl-micro mt-0.5 flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)]">
                    {[piece.claimedColor, piece.claimedSize].filter(Boolean).join(' / ')}
                    {piece.wearCount > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-[var(--color-heading)]">
                        <Flame
                          size={9}
                          aria-hidden="true"
                          className="text-[var(--color-highlight-bright)]"
                        />
                        {piece.wearCount} {piece.wearCount === 1 ? 'wear' : 'wears'}
                      </span>
                    ) : null}
                  </p>
                  {/* The piece's own feats. */}
                  {pieceFeats.length > 0 ? (
                    <ul className="mt-2 space-y-1 border-t border-[color-mix(in_oklab,var(--color-line)_70%,transparent)] pt-2">
                      {pieceFeats.map((feat, j) => (
                        <li
                          key={`${feat.title}-${j}`}
                          className="flex items-start gap-1.5 text-[10px] leading-snug text-[var(--color-text)]"
                        >
                          <Trophy
                            size={10}
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
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <p className="mt-10 text-center text-sm text-[var(--color-text-muted)]">
          No pieces shared yet.
        </p>
      )}

      {/* Feats not tied to a shared piece -------------------------------- */}
      {looseFeats.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={15} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
            <h2 className="anvl-heading text-lg text-[var(--color-heading)]">More feats</h2>
          </div>
          <ul className="space-y-2">
            {looseFeats.map((feat, i) => (
              <li
                key={`${feat.title}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface)] px-4 py-3"
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
        </section>
      ) : null}
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
