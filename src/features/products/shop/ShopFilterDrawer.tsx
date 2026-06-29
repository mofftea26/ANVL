import { Button, Drawer } from '@/shared/components/ui'
import {
  ShopFilterPanel,
  type ShopFilterPanelProps,
} from '@/features/products/shop/ShopFilterPanel'

/**
 * Mobile filter bottom-sheet. Filtering is live (no Apply step) — the sticky
 * footer shows the running result count and a Done button. Focus trap, Escape,
 * focus restore, and background scroll-lock come from the shared `Drawer`.
 */
export function ShopFilterDrawer({
  open,
  onClose,
  resultCount,
  panel,
}: {
  open: boolean
  onClose: () => void
  resultCount: number
  panel: ShopFilterPanelProps
}) {
  return (
    <Drawer open={open} onClose={onClose} title="Filters" placement="bottom" aria-label="Shop filters">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <ShopFilterPanel {...panel} hideReset />
        </div>
        <div className="sticky bottom-0 -mx-6 -mb-2 flex items-center gap-3 border-t border-[var(--shop-card-border)] bg-[var(--shop-surface)] px-6 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              panel.onReset()
            }}
          >
            Reset
          </Button>
          <Button type="button" className="flex-[1.4]" onClick={onClose}>
            Show {resultCount} {resultCount === 1 ? 'piece' : 'pieces'}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
