import { useMemo } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import { Container } from '@/shared/components/ui/Container'
import { cn } from '@/shared/lib/cn'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { WarBanner } from '@/shared/components/premium/WarBanner'
import type { OathResolvedContent } from '../content/oathContent.defaults'
import { OATH_PRODUCT_ROSTER } from '../content/oathContent.defaults'
import { oathCrestEmblem, oathProductImage, oathThemedMarkup } from '../theOathAssets'
import { OathSceneSeam } from './OathSceneSeam'

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
}: {
  product: ResolvedProduct
  index: number
  total: number
}) {
  const numeral = String(index + 1).padStart(2, '0')
  const cmsRender = oathProductImage(product.position)
  // On the mobile 2-col grid, an odd last item is centred across both columns.
  const isLonelyLast = total % 2 === 1 && index === total - 1
  return (
    <li
      data-banner
      data-banner-index={index}
      data-reveal-m
      className={cn(
        'flex w-full max-w-[14.5rem] flex-col items-center will-change-transform max-[767px]:mx-auto md:max-w-[clamp(10.5rem,17vw,15rem)]',
        isLonelyLast && 'max-[767px]:col-span-2',
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
          alt={product.name}
          label={numeral}
          placeholderSrc={cmsRender ?? oathCrestEmblem()}
          placeholderThemedMarkup={cmsRender ? null : oathThemedMarkup('crestSvg')}
          aspectClassName="aspect-[3/4.75]"
          elevated
          sway
          swayDelay={index * 0.45}
        />
      </SafeLink>

      <div className="mt-4 w-full text-center">
        <p className="anvl-micro text-[var(--color-highlight-bright)]">{product.role}</p>
        <h3 className="anvl-heading mt-1.5 text-lg font-normal leading-[0.95] md:text-xl">
          {product.name}
        </h3>
        <p className="mx-auto mt-2 hidden max-w-[14rem] text-xs leading-relaxed text-[var(--color-text-muted)] lg:block">
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
      className="relative flex min-h-[var(--anvl-section-h)] w-full flex-col justify-center overflow-hidden py-12 md:py-0"
      aria-label="The first three pieces"
    >
      {/* Top seam only — the products↔finale boundary is intentionally seamless
          (no bottom seam) so the two sections flow into each other. */}
      <OathSceneSeam edges="top" />

      {/* Oversized blurred ember wash — no boxed gradient edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-16 -right-16 -top-20 z-0"
      >
        <div
          className="absolute left-1/2 top-[38%] h-[min(42rem,95%)] w-[min(72rem,125%)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-90 blur-[72px] md:blur-[96px]"
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
          className="mx-auto mt-8 hidden h-1 w-[82%] max-w-4xl rounded-full md:block"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--color-graphite) 12%, color-mix(in srgb, var(--color-graphite) 68%, var(--anvl-bone)) 50%, var(--color-graphite) 88%, transparent)',
            boxShadow: '0 2px 10px -3px rgba(0,0,0,0.8)',
          }}
        />

        <div className="relative mx-auto mt-8 md:mt-6">
          <ul className="relative z-[1] mx-auto grid w-full grid-cols-2 gap-x-5 gap-y-10 [perspective:1600px] md:flex md:flex-row md:items-start md:justify-center md:gap-8 lg:gap-12">
            {resolved.map((product, i) => (
              <BannerColumn key={product.slug} product={product} index={i} total={resolved.length} />
            ))}
          </ul>
        </div>

        <div data-reveal-m className="mt-9 text-center md:mt-10">
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
