import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { PieceFeats } from '@/features/storefront-account/account/panels/armory/PieceFeats'
import { WoreItButton } from '@/features/storefront-account/account/panels/armory/WoreItButton'
import { buttonVariants } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { useOwnedPassportsQuery } from '../hooks/usePassport'

/**
 * The passport's ritual log — the same "Wore it" tap and Feats journal that
 * live on the Armory card, right here on the piece itself, plus the jump to
 * the product in the shop. Owner-only (the section registry gates it).
 */
export function PassportOwnerTools({
  token,
  productSlug,
}: {
  token: string | null
  productSlug: string
}) {
  const ownedQuery = useOwnedPassportsQuery()
  // This exact unit (by token) — wear belongs to the physical piece.
  const unit = (ownedQuery.data ?? []).find((p) => p.token === token) ?? null

  return (
    <div className="space-y-4">
      {unit ? (
        <div className="flex flex-wrap items-center gap-3">
          <WoreItButton
            passportId={unit.id}
            wearCount={unit.wearCount}
            lastWornAt={unit.lastWornAt}
          />
          {unit.lastWornAt ? (
            <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
              Last worn {new Date(unit.lastWornAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="anvl-micro text-[var(--color-text-muted)]">Loading your record…</p>
      )}

      {/* The feats journal for this product (add / edit / delete inline). */}
      <PieceFeats slug={productSlug} />

      <Link
        to="/shop/$slug"
        params={{ slug: productSlug }}
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'no-underline')}
      >
        <ExternalLink size={14} aria-hidden="true" className="mr-1.5" />
        View this product in the shop
      </Link>
    </div>
  )
}
