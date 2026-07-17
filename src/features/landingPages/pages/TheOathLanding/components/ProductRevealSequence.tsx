import { useMemo, useState } from 'react'
import { ArrowUpRight } from '@/shared/icons'
import type { Product } from '@/features/products/types/product.types'
import { Container } from '@/shared/components/ui/Container'
import { cn } from '@/shared/lib/cn'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { WarBanner } from '@/shared/components/premium/WarBanner'
import type { OathResolvedContent } from '../content/oathContent.defaults'
import { OATH_PRODUCT_ROSTER } from '../content/oathContent.defaults'
import { oathCrestEmblem, oathProductImage, oathThemedMarkup } from '../theOathAssets'
import { OATH_PRODUCTS_FINALE_BLEND_MASK, OathSceneSeam } from './OathSceneSeam'

interface ResolvedProduct {
  slug: string
  name: string
  role: string
  tone: string
  /** 1-based asset/position index for the per-piece CMS render. */
  position: number
  line: string
  href: string
  image?: string
  price?: string
}

/** Roster index of the hero / centre piece (three-banner row). */
const CENTER_BANNER_INDEX = 1

function isBannerFront(index: number, hoveredIndex: number | null): boolean {
  return hoveredIndex === null ? index === CENTER_BANNER_INDEX : index === hoveredIndex
}

/** Depth scale on md+ — lives on an inner wrapper so GSAP scroll reveal (on `[data-banner]`) stays conflict-free. */
const BANNER_DEPTH_FRONT = 'md:scale-[1.08]' as const
const BANNER_DEPTH_BACK = 'md:scale-[0.92]' as const

function bannerDepthClass(index: number, hoveredIndex: number | null): string {
  const isFront = isBannerFront(index, hoveredIndex)
  return cn(
    isFront ? BANNER_DEPTH_FRONT : BANNER_DEPTH_BACK,
    'md:origin-top md:transition-transform md:duration-300 md:ease-out',
  )
}

function bannerZClass(index: number, hoveredIndex: number | null): string {
  return isBannerFront(index, hoveredIndex) ? 'z-30' : 'z-10'
}

function formatPrice(product: Product): string | undefined {
  const amount = product.shop?.listPrice ?? product.price
  const currency = product.shop?.currency ?? 'USD'
  if (!amount || amount <= 0) return undefined
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount}`
  }
}

function BannerColumn({
  product,
  index,
  total,
  hoveredIndex,
  onHoverEnter,
}: {
  product: ResolvedProduct
  index: number
  total: number
  hoveredIndex: number | null
  onHoverEnter: (index: number) => void
}) {
  const numeral = String(index + 1).padStart(2, '0')
  const cmsRender = oathProductImage(product.position)
  const isHeroBanner = index === CENTER_BANNER_INDEX
  const isFront = isBannerFront(index, hoveredIndex)
  return (
    <li
      data-banner
      data-banner-index={index}
      data-reveal-m
      data-banner-front={isFront ? 'true' : undefined}
      onMouseEnter={() => onHoverEnter(index)}
      className={cn(
        'relative flex w-full max-w-[14.5rem] flex-col items-center max-md:mx-auto max-md:max-w-[10.75rem] md:max-w-[clamp(14rem,21vw,17rem)] xl:max-w-[clamp(9rem,13vw,12.5rem)]',
        bannerZClass(index, hoveredIndex),
        isHeroBanner && 'max-md:order-1 max-md:col-span-2',
        index === 0 && 'max-md:order-2',
        index === total - 1 && index !== CENTER_BANNER_INDEX && 'max-md:order-3',
      )}
    >
      <div
        data-banner-depth
        className={cn(
          'flex w-full flex-col items-center will-change-transform',
          bannerDepthClass(index, hoveredIndex),
        )}
      >
        <SafeLink
          href={product.href}
          className="focus-ring block w-full no-underline"
          aria-label={`${product.name} — view piece`}
          data-cursor="view"
        >
          <WarBanner
            tone={product.tone}
            media={product.image}
            mediaFit="contain"
            alt={product.name}
            label={numeral}
            placeholderSrc={cmsRender ?? oathCrestEmblem()}
            placeholderThemedMarkup={cmsRender ? null : oathThemedMarkup('crestSvg')}
            aspectClassName="aspect-[3/4.75] md:aspect-[3/4.35] xl:aspect-[3/4.15]"
            elevated
            sway
            swayDelay={index * 0.45}
          />
        </SafeLink>

        <div className="mt-4 w-full text-center md:mt-3 xl:mt-4">
        <p className="anvl-micro text-[var(--color-highlight-bright)]">{product.role}</p>
        <h3 className="anvl-heading mt-1.5 text-lg font-normal leading-[0.95] md:text-lg xl:text-xl">
          {product.name}
        </h3>
        <p className="mx-auto mt-2 hidden max-w-[14rem] text-xs leading-relaxed text-[var(--color-text-muted)] xl:block">
          {product.line}
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <SafeLink
            href={product.href}
            className="focus-ring inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)] no-underline transition-colors hover:text-[var(--color-highlight-bright)]"
            data-cursor="view"
          >
            View piece
            <ArrowUpRight size={13} aria-hidden="true" className="shrink-0" />
          </SafeLink>
          {product.price ? (
            <span className="anvl-display text-sm text-[var(--color-text)]">{product.price}</span>
          ) : null}
        </div>
        </div>
      </div>
    </li>
  )
}

/**
 * Scene 04 — the three pieces, raised as war banners. On desktop/tablet the
 * section pins and the banners **assemble horizontally** (outer two slide in
 * from the edges, centre drops onto the forged rail) — a sideways read driven
 * by vertical scroll (`buildOathProducts`). On mobile / reduced motion they
 * stack into a vertical column and reveal lightly. Copy (heading + per-piece
 * taglines) is CMS-driven; the roster (slug/name/role/tone) is code-owned.
 */
export function ProductRevealSequence({
  products,
  content,
}: {
  products: Product[]
  content: OathResolvedContent['products']
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const resolved = useMemo<ResolvedProduct[]>(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]))
    return OATH_PRODUCT_ROSTER.map((copy, i) => {
      const live = bySlug.get(copy.slug)
      return {
        slug: copy.slug,
        name: copy.name,
        role: copy.role,
        tone: copy.tone,
        position: i + 1,
        line: content.taglines[copy.slug] ?? '',
        href: live ? `/shop/${live.slug}` : content.viewAllHref,
        image: live?.images?.[0]?.src ?? oathProductImage(i + 1),
        price: live ? formatPrice(live) : undefined,
      }
    })
  }, [products, content])

  return (
    <section
      data-scene="products"
      data-product-reveal
      id="products"
      className={cn(
        'relative flex min-h-[100svh] w-full flex-col justify-center overflow-hidden py-12 md:min-h-[min(76svh,calc(var(--anvl-section-h)*0.82))] md:py-7 xl:min-h-[100svh] xl:pb-0 xl:pt-[var(--anvl-header-h)]',
        OATH_PRODUCTS_FINALE_BLEND_MASK,
      )}
      aria-label="The first three pieces"
    >
      {/* Top dissolve — tenets→products (desktop) or hero→products (mobile/tablet).
          Subtle tone on smaller viewports avoids a visible split line. */}
      <OathSceneSeam edges="top" tone="subtle" className="xl:hidden" />
      <OathSceneSeam edges="top" className="hidden xl:block" />

      {/* Bottom into finale — subtle bg-feather on mobile/tablet; xl+ blend (alpha
          mask + transparent seam, no dark void band). */}
      <OathSceneSeam edges="bottom" tone="subtle" className="xl:hidden" />
      <OathSceneSeam edges="bottom" tone="blend" className="hidden xl:block" />

      {/* Oversized blurred ember wash — bottom mask so overflow-hidden never
          clips it into a hard line; xl fades earlier/softer for transparent blend. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-16 -right-16 -top-20 z-0 max-xl:[mask-image:linear-gradient(to_bottom,black_0%,black_52%,transparent_90%)] max-xl:[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_52%,transparent_90%)] xl:[mask-image:linear-gradient(to_bottom,black_0%,black_44%,transparent_78%)] xl:[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_44%,transparent_78%)]"
      >
        <div
          className="absolute left-1/2 top-[38%] h-[min(42rem,95%)] w-[min(72rem,125%)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-90 blur-[72px] md:h-[min(30rem,82%)] md:blur-[80px] xl:h-[min(42rem,95%)] xl:opacity-70 xl:blur-[96px]"
          style={{ background: 'var(--color-highlight-soft, transparent)' }}
        />
      </div>

      <Container className="relative z-10 w-full">
        <div
          data-products-heading
          data-reveal-m
          className="mx-auto max-w-3xl text-center will-change-transform"
        >
          <p className="anvl-display text-xs tracking-[0.3em] text-[var(--color-highlight-bright)]">
            {content.eyebrow}
          </p>
          <h2 className="anvl-heading mt-3 font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(1.75rem,5vw,3.5rem)]">
            {content.title}
          </h2>
        </div>

        {/* Shared forged rail the banners hang from. */}
        <div
          aria-hidden="true"
          data-banner-rail
          className="mx-auto mt-8 hidden h-1 w-[82%] max-w-4xl rounded-full md:mt-5 md:block xl:mt-5"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--color-graphite) 12%, color-mix(in srgb, var(--color-graphite) 68%, var(--anvl-bone)) 50%, var(--color-graphite) 88%, transparent)',
            boxShadow: '0 2px 10px -3px rgba(0,0,0,0.8)',
          }}
        />

        <div className="relative mx-auto mt-8 md:mt-5 xl:mt-4">
          <ul
            className="relative z-[1] mx-auto grid w-full grid-cols-2 max-md:justify-items-center max-md:gap-x-3 gap-x-5 gap-y-10 [perspective:1600px] md:flex md:flex-row md:items-start md:justify-center md:gap-20 xl:gap-20"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {resolved.map((product, i) => (
              <BannerColumn
                key={product.slug}
                product={product}
                index={i}
                total={resolved.length}
                hoveredIndex={hoveredIndex}
                onHoverEnter={setHoveredIndex}
              />
            ))}
          </ul>
        </div>

        <div data-reveal-m className="mt-9 text-center md:mt-7 xl:mt-6">
          <SafeLink
            href={content.viewAllHref}
            className="focus-ring inline-flex items-center gap-2 border-b border-[var(--color-highlight)]/50 pb-1 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text)] no-underline transition-colors hover:text-[var(--color-highlight-bright)]"
            data-cursor="view"
          >
            {content.viewAllLabel}
            <ArrowUpRight size={15} aria-hidden="true" />
          </SafeLink>
        </div>
      </Container>
    </section>
  )
}
