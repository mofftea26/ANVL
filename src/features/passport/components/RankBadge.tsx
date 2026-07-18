import { useStorefrontAccountSession } from '@/features/storefront-account/publicAccount.core'
import { cn } from '@/shared/lib/cn'
import { useGamificationRules } from '../hooks/useGamificationRules'
import { useOwnedPassportsQuery } from '../hooks/usePassport'
import { deriveArmoryRank } from '../lib/ranks'

/**
 * The athlete's rank emblem, compact — for identity surfaces (account welcome
 * header, nav drawer card, avatar dropdown). Derived from registered pieces;
 * renders nothing signed-out or before the owned list arrives.
 */
export function RankBadge({
  className,
  showTitle = false,
}: {
  className?: string
  showTitle?: boolean
}) {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  const ownedQuery = useOwnedPassportsQuery()
  const rules = useGamificationRules()
  if (!customerId || !ownedQuery.data) return null

  // Count-based rank (no catalog cross-reference on chrome surfaces — the
  // full completion-aware rank lives in the Armory itself).
  const rank = deriveArmoryRank(ownedQuery.data.length, [], rules)

  return (
    <span
      className={cn('inline-flex shrink-0 items-center gap-2', className)}
      title={rank.title}
    >
      <img
        src={rank.emblemSrc}
        alt={`Rank: ${rank.title}`}
        width={64}
        height={64}
        loading="lazy"
        decoding="async"
        className="h-9 w-9 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.55)]"
      />
      {showTitle ? (
        <span className="anvl-micro text-[9px] uppercase tracking-[0.16em] text-[var(--color-highlight-bright)]">
          {rank.title}
        </span>
      ) : null}
    </span>
  )
}
