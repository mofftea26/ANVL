import { Link } from '@tanstack/react-router'
import { useRef } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'
import type { ResolvedPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { useShopConfig } from '@/features/products/shop/hooks/useShopConfig'
import { usePdpVariant } from '@/features/products/pdp/hooks/usePdpVariant'
import { usePdpReveal } from '@/features/products/pdp/hooks/usePdpReveal'
import { useTrackProductView } from '@/features/products/hooks/useTrackProductView'
import { PdpGallery } from '@/features/products/pdp/PdpGallery'
import { PdpBuyPanel } from '@/features/products/pdp/PdpBuyPanel'
import { PdpStickyBar } from '@/features/products/pdp/PdpStickyBar'
import { PdpBento } from '@/features/products/pdp/PdpBento'
import { PdpRelated } from '@/features/products/pdp/PdpRelated'
import { PdpReviews } from '@/features/products/pdp/PdpReviews'
import type { ResolvedPdpContent } from '@/features/products/pdp/resolvePdpContent'
import type { PdpProductSupport } from '@/features/products/pdp/PdpSupportDetails'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { JsonLd } from '@/shared/components/seo/JsonLd'
import { breadcrumbJsonLd, productJsonLd } from '@/shared/components/seo/structuredData'
import { Container } from '@/shared/components/ui'

export type ProductDetailPageProps = {
  product: Product
  related: Product[]
  assets: ResolvedPageAssets
  /** Per-product editorial content (CMS → product → global slot → default). */
  content: ResolvedPdpContent
  shopConfig: ShopConfig
  /** True when this product has a published Story book to link to. */
  hasStoryBook?: boolean
  /** This product's authored measurements + care (from `support_content`). */
  support?: PdpProductSupport
}

/**
 * Rebuilt product detail page. Commerce-first above the fold (sticky gallery +
 * buy panel), then cinematic CMS-driven sections below. All variant state lives
 * in `usePdpVariant` (shared across gallery / buy panel / colorways / sticky
 * bar); scroll reveals come from `usePdpReveal`. Theme via `--shop-*`.
 */
export function ProductDetailPage({ product, related, assets, content, shopConfig: initialConfig, hasStoryBook, support }: ProductDetailPageProps) {
  const config = useShopConfig(initialConfig)
  const pdp = config.pdp
  const variant = usePdpVariant(product)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useTrackProductView(product)
  usePdpReveal(rootRef, {
    intensity: pdp.animationIntensity,
    durationMultiplier: config.animationDurationMultiplier,
  })

  return (
    <div ref={rootRef} className="bg-[var(--shop-bg)] pt-[calc(var(--anvl-header-h)+1.5rem)]">
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
          { name: product.name, path: `/shop/${product.slug}` },
        ])}
      />

      <Container>
        <nav aria-label="Breadcrumb" className="anvl-micro mb-6 flex flex-wrap gap-2 text-xs text-[var(--shop-text-muted)]">
          <Link to="/" className="hover:text-[var(--shop-accent)]">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/shop" search={defaultShopUrlSearch} className="hover:text-[var(--shop-accent)]">Shop</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--shop-text)]">{product.name}</span>
        </nav>

        {/* E-commerce zone — gallery floats and stretches to the buy-panel height. */}
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.92fr)_1fr] lg:items-stretch lg:gap-10">
          <div className="mx-auto w-full max-w-[24rem] lg:h-full lg:max-w-none">
            <PdpGallery
              images={variant.galleryImages}
              productName={product.name}
              galleryFallback={assets.galleryFallback}
            />
          </div>
          <PdpBuyPanel product={product} variant={variant} showShare={pdp.showShare} support={support} />
        </div>
      </Container>

      {/* Cinematic zone — a compact bento grid (the "second screen"). */}
      <div className="mt-2">
        <PdpBento product={product} variant={variant} content={content} pdp={pdp} hasStoryBook={hasStoryBook} support={support} />
        <PdpReviews slug={product.slug} />
        {pdp.showRelated ? <PdpRelated products={related} count={pdp.relatedCount} /> : null}
      </div>

      {/* Mobile sticky add bar + spacer so it never covers content. */}
      <div aria-hidden="true" className="h-[calc(72px+env(safe-area-inset-bottom,0px))] lg:hidden" />
      <PdpStickyBar product={product} variant={variant} />
    </div>
  )
}
