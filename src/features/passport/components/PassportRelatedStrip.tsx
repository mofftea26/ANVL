import { Link } from '@tanstack/react-router'
import { BadgeCheck } from 'lucide-react'
import { AnvlCrest } from '@/shared/assets/brand'
import { useOwnedPassportsQuery } from '../hooks/usePassport'
import {
  isDropComplete,
  unregistered,
  type PassportRelated,
  type RelatedProductRef,
} from '../lib/relatedProducts'

/**
 * "Complete the Loadout" — a deliberately subtle related-products strip.
 *
 *  - `mode="drop"`: the rest of this piece's drop the owner hasn't registered.
 *    When they hold the whole drop it becomes a quiet completion seal instead.
 *  - `mode="category"`: other pieces in the same category still to collect.
 *
 * Owner-only (the section registry gates it); it mirrors the gap already
 * visible in the Armory rather than pushing a sale, and links to the shop PDP.
 * The ownership filter is client-side because SSR is anon.
 */
export function PassportRelatedStrip({
  mode,
  related,
}: {
  mode: 'drop' | 'category'
  related: PassportRelated
}) {
  const ownedQuery = useOwnedPassportsQuery()
  const owned = ownedQuery.data ?? []

  if (mode === 'drop' && isDropComplete(related, owned)) {
    return <DropCompleteSeal dropName={related.dropName} />
  }

  const candidates = mode === 'drop' ? related.dropMates : related.categoryMates
  const missing = unregistered(candidates, owned)

  if (missing.length === 0) {
    // The owner already holds every candidate (category has no seal — a quiet
    // acknowledgement keeps the card from looking empty).
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Every matching piece is already in your armory.
      </p>
    )
  }

  return (
    <div>
      <p className="mb-4 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
        {mode === 'drop'
          ? `Pieces of ${related.dropName || 'this drop'} still to forge into your armory.`
          : 'Other pieces that complete the loadout.'}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {missing.map((piece) => (
          <RelatedCard key={piece.slug} piece={piece} />
        ))}
      </ul>
    </div>
  )
}

function RelatedCard({ piece }: { piece: RelatedProductRef }) {
  return (
    <li>
      <Link
        to="/shop/$slug"
        params={{ slug: piece.slug }}
        className="focus-ring group block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 no-underline motion-safe:transition-transform hover:-translate-y-1"
      >
        {piece.image ? (
          <img
            src={piece.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            width={300}
            height={380}
            className="mb-2 aspect-[3/4] w-full rounded-md object-cover opacity-90 motion-safe:transition-opacity group-hover:opacity-100"
          />
        ) : null}
        <p className="truncate text-xs font-semibold text-[var(--color-heading)]">
          {piece.name}
        </p>
        <p className="anvl-micro text-[9px] text-[var(--color-text-muted)]">Not yet registered</p>
      </Link>
    </li>
  )
}

/** The reward for holding a full drop — a quiet seal, not another strip. */
function DropCompleteSeal({ dropName }: { dropName: string }) {
  return (
    <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-highlight)_10%,var(--color-surface))_0%,var(--color-surface)_70%)] p-6 text-center">
      <AnvlCrest
        aria-label="ANVL crest"
        className="h-12 w-auto text-[var(--color-highlight-bright)]"
      />
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
        <BadgeCheck aria-hidden="true" className="h-4 w-4 text-[var(--color-success)]" />
        {dropName || 'This drop'} — complete
      </p>
      <p className="anvl-micro text-[var(--color-text-muted)]">
        Every piece of the drop stands forged in your armory.
      </p>
    </div>
  )
}
