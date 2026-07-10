import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { Flip, gsap, useGSAP } from '@/shared/lib/gsap'
import type { Product } from '@/features/products/types/product.types'
import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'
import { ShopProductCard } from '@/features/products/components/ShopProductCard'
import { ProductCard } from '@/shared/components/ui/ProductCard'
import { cn } from '@/shared/lib/cn'

/**
 * Responsive product grid. Columns/gap/density are CMS-driven; the layout is
 * pure CSS Grid (no JS measurement). A GSAP Flip pass animates the reflow when
 * the filtered/sorted set changes — short, transform-only, and gated to desktop
 * + no-reduced-motion via matchMedia.
 */
export function ProductGrid({
  products,
  config,
  cardTexture,
  cardEmptyImage,
  onQuickView,
}: {
  products: Product[]
  config: ShopConfig
  cardTexture?: string
  cardEmptyImage?: string
  onQuickView?: (product: Product) => void
}) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const flipStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null)
  const prevKeyRef = useRef<string | null>(null)
  // Signature of the current order — Flip re-runs only when it actually changes.
  const orderKey = products.map((p) => p.id).join(',')

  // Snapshot the OLD layout during render, before React commits the new order —
  // `useGSAP` runs post-commit, which would capture the already-updated DOM and
  // animate nothing. Reading the still-mounted DOM here is the canonical
  // React + Flip pattern. Client-only (gridRef is null on the server).
  if (
    typeof window !== 'undefined' &&
    gridRef.current &&
    prevKeyRef.current !== null &&
    prevKeyRef.current !== orderKey
  ) {
    flipStateRef.current = Flip.getState(
      gridRef.current.querySelectorAll('[data-flip-id]'),
    )
  }
  prevKeyRef.current = orderKey

  useGSAP(
    () => {
      const state = flipStateRef.current
      flipStateRef.current = null
      if (!state) return
      const mm = gsap.matchMedia()
      mm.add(
        {
          desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          reduced: '(max-width: 767px), (prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          // Reduced/mobile: React already committed the final DOM order — the
          // grid just shows it with no animation (Flip has nothing to animate).
          if (!ctx.conditions?.desktop) return
          Flip.from(state, {
            duration: 0.42 * config.animationDurationMultiplier,
            ease: 'power2.out',
            stagger: 0.015,
            absolute: true,
            onEnter: (els) =>
              gsap.fromTo(
                els,
                { opacity: 0, scale: 0.96 },
                { opacity: 1, scale: 1, duration: 0.3 * config.animationDurationMultiplier },
              ),
            onLeave: (els) =>
              gsap.to(els, {
                opacity: 0,
                scale: 0.96,
                duration: 0.2 * config.animationDurationMultiplier,
              }),
          })
        },
      )
      return () => mm.revert()
    },
    { dependencies: [orderKey], scope: gridRef },
  )

  const style: CSSProperties = {
    gap: `${config.gridGap}px`,
    ['--shop-card-radius' as string]: `${config.cardRadius}px`,
  }

  return (
    <div
      ref={gridRef}
      className={cn('grid', gridColsClass(config.gridDensity, config.desktopColumns))}
      style={style}
    >
      {products.map((product) =>
        config.cardStyle === 'banner' ? (
          // Alternate CMS preset — the heraldic WarBanner card (no quick-add /
          // quick-view; navigation only). Wrapped so Flip can track it.
          <div key={product.id} data-flip-id={product.id}>
            <ProductCard product={product} />
          </div>
        ) : (
          <ShopProductCard
            key={product.id}
            product={product}
            config={config}
            cardTexture={cardTexture}
            cardEmptyImage={cardEmptyImage}
            onQuickView={onQuickView}
          />
        ),
      )}
    </div>
  )
}

function gridColsClass(
  density: ShopConfig['gridDensity'],
  desktopColumns: ShopConfig['desktopColumns'],
): string {
  const wide = desktopColumns === 4
  switch (density) {
    case 'compact':
      return cn(
        'grid-cols-2 md:grid-cols-3',
        wide ? 'xl:grid-cols-4' : 'xl:grid-cols-3',
      )
    case 'spacious':
      return cn(
        'grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-3',
        wide ? 'xl:grid-cols-4' : 'xl:grid-cols-3',
      )
    case 'comfortable':
    default:
      return cn(
        'grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3',
        wide ? 'xl:grid-cols-4' : 'xl:grid-cols-3',
      )
  }
}
