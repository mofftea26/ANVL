import { cn } from '@/shared/lib/cn'
import {
  ShopFilterPanel,
  type ShopFilterPanelProps,
} from '@/features/products/shop/ShopFilterPanel'

/**
 * Desktop sticky filter rail (≥lg). Stays narrow so product cards keep their
 * width; sticks under the header with its own scroll when the list is long.
 */
export function ShopFilterRail({
  sticky = true,
  ...panel
}: ShopFilterPanelProps & { sticky?: boolean }) {
  return (
    <aside className="hidden w-full max-w-[16rem] shrink-0 lg:block xl:max-w-[17rem]">
      <div
        className={cn(
          'rounded-xl border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] p-5',
          sticky &&
            'sticky top-[calc(var(--anvl-header-h)+1.5rem)] max-h-[calc(100svh-var(--anvl-header-h)-3rem)] overflow-y-auto overscroll-contain',
        )}
      >
        <p className="anvl-micro mb-4 inline-flex items-center gap-2 text-[var(--shop-accent)] before:h-px before:w-5 before:bg-[var(--shop-accent)] before:content-['']">
          Refine the armory
        </p>
        <ShopFilterPanel {...panel} />
      </div>
    </aside>
  )
}
