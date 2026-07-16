import { Flame, Star, Trophy } from 'lucide-react'
import { deriveArmoryRank } from '../lib/ranks'
import type { PublicArmory } from '../schemas/passport.schema'

/**
 * The read-only face of an athlete's Armory — what a visitor sees at
 * /armory/$handle. Renders only what the owner chose to make public (pieces,
 * feats) and never exposes tokens, serials or ids (the RPC already stripped
 * them). This is the "read" half of the two-state armory; the owner's own
 * account panel is the "read + write" half.
 */
export function PublicArmoryView({
  armory,
  images,
}: {
  armory: PublicArmory
  images: Record<string, string | undefined>
}) {
  // Rank from the true total (completion needs the catalog cross-reference we
  // don't expose publicly, so this never overstates — Warlord bonuses aside).
  const rank = deriveArmoryRank(armory.totalPieces, [])
  const honored = armory.pieces
    .filter((p) => p.featuredSlot)
    .sort((a, b) => (a.featuredSlot ?? 9) - (b.featuredSlot ?? 9))
    .slice(0, 3)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Standing ------------------------------------------------------- */}
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
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {rank.title} · {armory.totalPieces}{' '}
            {armory.totalPieces === 1 ? 'piece forged' : 'pieces forged'}
          </p>
        </div>
      </header>

      {/* Hall of Honor -------------------------------------------------- */}
      {honored.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Star
              size={15}
              aria-hidden="true"
              className="fill-[var(--color-highlight-bright)] text-[var(--color-highlight-bright)]"
            />
            <h2 className="anvl-heading text-lg text-[var(--color-heading)]">Hall of Honor</h2>
          </div>
          <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
            {honored.map((piece) => (
              <div
                key={piece.featuredSlot}
                className="flex flex-col items-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[var(--color-surface-elevated)] p-3"
              >
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-[color-mix(in_oklab,var(--color-bg)_60%,transparent)]">
                  {images[piece.productSlug] ? (
                    <img
                      src={images[piece.productSlug]}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Star size={18} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                  )}
                </div>
                <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[var(--color-heading)]">
                  {piece.productName}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Pieces --------------------------------------------------------- */}
      {armory.pieces.length > 0 ? (
        <section className="mt-10">
          <h2 className="anvl-heading mb-3 text-lg text-[var(--color-heading)]">The Collection</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {armory.pieces.map((piece, i) => (
              <div
                key={`${piece.productSlug}-${i}`}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
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
                <p className="anvl-micro mt-0.5 flex items-center gap-1 text-[9px] text-[var(--color-text-muted)]">
                  {[piece.claimedColor, piece.claimedSize].filter(Boolean).join(' / ')}
                  {piece.wearCount > 0 ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Flame size={9} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
                      {piece.wearCount}
                    </span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-10 text-center text-sm text-[var(--color-text-muted)]">
          No pieces shared yet.
        </p>
      )}

      {/* Feats ---------------------------------------------------------- */}
      {armory.feats.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={15} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
            <h2 className="anvl-heading text-lg text-[var(--color-heading)]">Feats</h2>
          </div>
          <ul className="space-y-2">
            {armory.feats.map((feat, i) => (
              <li
                key={`${feat.title}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3"
              >
                <span className="text-sm font-semibold text-[var(--color-heading)]">
                  {feat.title}
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
