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

      {/* Hall of Honor — forged plaques (the toast plate language) -------- */}
      {honored.length > 0 ? (
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-[var(--color-line)]" />
            <h2 className="anvl-micro text-[10px] uppercase tracking-[0.26em] text-[var(--color-highlight-bright)]">
              Hall of Honor
            </h2>
            <span aria-hidden="true" className="h-px w-8 bg-[var(--color-line)]" />
          </div>

          <div
            className={cn(
              'mx-auto grid max-w-2xl gap-3',
              honored.length === 1
                ? 'grid-cols-1 max-w-xs'
                : honored.length === 2
                  ? 'grid-cols-2 max-w-md'
                  : 'grid-cols-1 sm:grid-cols-3',
            )}
          >
            {honored.map((piece, i) => (
              <figure
                key={piece.featuredSlot}
                className="group relative [filter:drop-shadow(0_10px_22px_rgba(0,0,0,0.5))] motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-0.5"
              >
                {/* The plate — bevel-cut steel with a champagne heat edge. */}
                <div className="relative flex items-center gap-3 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-highlight)_10%,var(--color-surface-elevated))_0%,var(--color-surface)_55%,color-mix(in_oklab,var(--color-bg)_85%,black)_100%)] p-2.5 pr-3 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
                  {/* Heat hairline along the top edge. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,var(--color-highlight-bright)_35%,color-mix(in_oklab,var(--color-highlight)_60%,transparent)_70%,transparent_100%)]"
                  />
                  {images[piece.productSlug] ? (
                    <img
                      src={images[piece.productSlug]}
                      alt={piece.productName}
                      loading="lazy"
                      decoding="async"
                      width={112}
                      height={140}
                      className="h-16 w-[52px] shrink-0 rounded-[3px] object-cover [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]"
                    />
                  ) : (
                    <div className="grid h-16 w-[52px] shrink-0 place-items-center rounded-[3px] bg-[var(--color-surface-elevated)]">
                      <Star size={16} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="anvl-micro text-[8px] uppercase tracking-[0.2em] text-[color-mix(in_oklab,var(--color-highlight-bright)_80%,transparent)]">
                      Honor {ROMAN[i] ?? ''}
                    </p>
                    <figcaption className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-tight text-[var(--color-heading)]">
                      {piece.productName}
                    </figcaption>
                    {piece.wearCount > 0 ? (
                      <p className="anvl-micro mt-1 flex items-center gap-1 text-[9px] text-[var(--color-text-muted)]">
                        <Flame
                          size={10}
                          aria-hidden="true"
                          className="text-[var(--color-highlight-bright)]"
                        />
                        {piece.wearCount} {piece.wearCount === 1 ? 'wear' : 'wears'}
                      </p>
                    ) : null}
                  </div>
                  {/* Engraved numeral seated in the cut corner. */}
                  <span
                    aria-hidden="true"
                    className="anvl-heading self-start text-lg leading-none text-[color-mix(in_oklab,var(--color-highlight-bright)_45%,transparent)] [text-shadow:0_1px_0_rgba(0,0,0,0.8)]"
                  >
                    {ROMAN[i] ?? ''}
                  </span>
                </div>
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
                          size={11}
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
            <Trophy size={17} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
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
