import type { CSSProperties } from 'react'
import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'
import { cn } from '@/shared/lib/cn'

const ASPECT_CLASS: Record<ShopConfig['cardAspectRatio'], string> = {
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
  tall: 'aspect-[4/5]',
}

/**
 * Card-shaped loading skeletons that match the real grid layout exactly (same
 * columns/gap/aspect) so there is no layout shift when content arrives. Kept to
 * a modest count so we never animate dozens of placeholders.
 */
export function ProductGridSkeleton({
  count = 6,
  config,
}: {
  count?: number
  config: ShopConfig
}) {
  const style: CSSProperties = { gap: `${config.gridGap}px` }
  return (
    <div
      className={cn(
        'grid',
        config.desktopColumns === 4
          ? 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3',
      )}
      style={style}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3.5">
          <div
            className={cn(
              'w-full rounded-[var(--shop-card-radius,14px)] motion-safe:animate-pulse',
              ASPECT_CLASS[config.cardAspectRatio],
            )}
            style={{
              background:
                'linear-gradient(135deg, var(--shop-skeleton-from), var(--shop-skeleton-to))',
            }}
          />
          <div className="h-2.5 w-16 rounded bg-[var(--shop-skeleton-to)] motion-safe:animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-[var(--shop-skeleton-to)] motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  )
}
