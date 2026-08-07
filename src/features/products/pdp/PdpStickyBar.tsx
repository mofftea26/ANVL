import { Check } from '@/shared/icons'
import type { Product } from '@/features/products/types/product.types'
import type { PdpVariant } from '@/features/products/pdp/hooks/usePdpVariant'
import { Button, Container } from '@/shared/components/ui'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { formatMoney } from '@/shared/lib/money'

/**
 * Mobile-only sticky add-to-cart bar. Always reachable with one thumb; safe-area
 * aware. Shares the `usePdpVariant` action so it reflects the current
 * colorway/size selection. Hidden on lg+. The page renders a spacer so the bar
 * never covers content.
 */
export function PdpStickyBar({ product, variant }: { product: Product; variant: PdpVariant }) {
  const { displayPrice, canPurchase, addState, add } = variant
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--shop-card-border)] bg-[var(--shop-bg)]/95 px-3 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur lg:hidden">
      <Container className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="anvl-heading truncate text-lg text-[var(--shop-text)]">{product.name}</p>
          <p className="anvl-display text-sm text-[var(--shop-text-muted)]">{formatMoney(displayPrice, product.shop?.currency)}</p>
        </div>
        <Button className="shrink-0" disabled={!canPurchase || addState !== 'idle'} onClick={add}>
          {addState === 'added' ? (
            <>
              <Check size={ICON_SIZE.md} aria-hidden="true" className="mr-1.5" /> Added
            </>
          ) : canPurchase ? (
            'Add to cart'
          ) : (
            'Unavailable'
          )}
        </Button>
      </Container>
    </div>
  )
}
