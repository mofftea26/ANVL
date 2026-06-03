import { useRef } from 'react'
import { previewPiecesFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { useActIdleMotion } from '../shared/useActIdleMotion'
import { cn } from '@/shared/lib/cn'
import type { ActPresetProps } from '../types'
import { KingdomBannerProductCard } from './KingdomBannerProductCard'
import { ProductShowcaseHeader } from './ProductShowcaseHeader'
import { pickFeaturedProducts } from './oathProductUtils'

export function OathBannerShowcasePreset({ landing, row, products }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const p = previewPiecesFields(landing.pieces, row)
  const featured = pickFeaturedProducts(products, row?.productIds, 3)

  useActPresetMotion(rootRef, row, { staggerSelector: '[data-act-block]' })
  useActIdleMotion(rootRef, row, { floatSelector: '[data-act-eyebrow]' })

  return (
    <ActPresetShell
      rootRef={rootRef}
      row={row}
      sectionSize="showcase"
      ariaLabel="Product banners"
      className="anvl-act-showcase--banners bg-[var(--color-bg)]"
      contentClassName="overflow-visible"
    >
      <ProductShowcaseHeader
        actLabel={p.actLabel}
        headingLineOne={p.headingLineOne}
        headingLineTwo={p.headingLineTwo}
        viewAllHref={p.viewAllHref}
        viewAllLabel={p.viewAllLabel}
      />

      <div
        className={cn(
          'anvl-banner-showcase-row relative min-h-0 flex-1 overflow-visible',
          '[perspective:1100px]',
        )}
        aria-label="Drop pieces as banners"
      >
        <div
          className="pointer-events-none absolute inset-x-[10%] top-1.5 z-0 hidden h-1 rounded-full border border-[color-mix(in_srgb,var(--anvl-bone)_28%,transparent)] bg-gradient-to-b from-[#4a4d52] to-[#222428] md:block"
          aria-hidden
        />

        <div className="anvl-act-showcase-track anvl-act-showcase-track--grid relative z-[1] items-end pt-3 md:pt-4">
          {featured.map((product, i) => (
            <KingdomBannerProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </ActPresetShell>
  )
}
