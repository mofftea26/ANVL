import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Check } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'
import type { PdpVariant } from '@/features/products/pdp/hooks/usePdpVariant'
import { colorHasNoStock } from '@/features/products/pdp/hooks/usePdpVariant'
import type { ResolvedPdpContent } from '@/features/products/pdp/resolvePdpContent'
import { extractYoutubeVideoId } from '@/features/products/pdp/videoEmbed'
import { Container } from '@/shared/components/ui'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import { cn } from '@/shared/lib/cn'

function Tile({
  className,
  eyebrow,
  bg,
  children,
}: {
  className?: string
  eyebrow?: string
  bg?: string
  children?: ReactNode
}) {
  const style: CSSProperties | undefined = bg
    ? { backgroundImage: `url('${bg}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined
  return (
    <article
      data-reveal
      className={cn(
        'relative flex min-h-[12rem] flex-col overflow-hidden rounded-xl border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] p-4',
        className,
      )}
      style={style}
    >
      {eyebrow ? (
        <p className="anvl-display relative z-10 mb-2 text-[10px] tracking-[0.26em] text-[var(--shop-accent)]">
          {eyebrow}
        </p>
      ) : null}
      {children}
    </article>
  )
}

/**
 * Cinematic content as a compact bento grid (the "second screen"). All copy +
 * editorial assets come from `ResolvedPdpContent` (per-product CMS content →
 * product field → global slot), so each product can carry its own story,
 * material, care, details, and imagery. Commerce bits (colorways, video) come
 * from the product. Packed with `grid-auto-flow: dense`; mobile stacks. Reveals
 * via the parent's `usePdpReveal` (`data-reveal`).
 */
export function PdpBento({
  product,
  variant,
  content,
  pdp,
  hasStoryBook,
}: {
  product: Product
  variant: PdpVariant
  content: ResolvedPdpContent
  pdp: ShopConfig['pdp']
  hasStoryBook?: boolean
}) {
  const { colorwayIndex, setColorwayIndex } = variant
  const youtube = extractYoutubeVideoId(product.shop?.videoUrl)
  const hasLifestyle = Boolean(content.lifestyleImage)

  const showStory = pdp.showStory && (content.storyBody || hasLifestyle)
  const showMaterials = pdp.showMaterials && (content.materialTitle || content.materialNote || content.materialMacro)
  const showCare = pdp.showMaterials && content.care.length > 0
  const showColorways = pdp.showColorways && product.colorways.length > 1
  const showDetails = pdp.showDesignDetails && content.designDetails.length > 0
  const showSizeGuide = pdp.showSizeGuide
  const showStoryBook = pdp.showStoryBook && Boolean(hasStoryBook)

  return (
    <section
      className="relative border-t border-[var(--shop-card-border)] py-10 md:py-14"
      style={
        content.ambientBackdrop
          ? { backgroundImage: `url('${content.ambientBackdrop}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {content.ambientBackdrop ? (
        <div aria-hidden="true" className="absolute inset-0 bg-[var(--shop-bg)]/88" />
      ) : null}
      <Container className="relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:auto-rows-[12rem] md:grid-cols-4 md:[grid-auto-flow:dense]">
          {showStory ? (
            <Tile
              className="justify-end md:col-span-2 md:row-span-2"
              bg={hasLifestyle ? content.lifestyleImage : undefined}
            >
              {hasLifestyle ? (
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[var(--shop-bg)] via-[var(--shop-bg)]/30 to-transparent" />
              ) : null}
              <div className="relative z-10">
                <p className="anvl-display mb-2 text-[10px] tracking-[0.26em] text-[var(--shop-accent)]">
                  {content.storyHeading}
                </p>
                <p className="anvl-heading max-w-md text-lg font-normal leading-snug text-[var(--shop-text)] md:text-xl">
                  {stripAngleBracketTags(content.storyBody || product.name)}
                </p>
              </div>
            </Tile>
          ) : null}

          {showMaterials ? (
            <Tile className="justify-end md:col-span-1 md:row-span-2" bg={content.materialMacro}>
              {!content.materialMacro ? (
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: 'repeating-linear-gradient(125deg, var(--shop-card-bg) 0 2px, var(--shop-image-bg) 2px 9px)' }}
                />
              ) : (
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[var(--shop-bg)]/90 to-transparent" />
              )}
              <div className="relative z-10">
                <p className="anvl-display mb-1 text-[10px] tracking-[0.26em] text-[var(--shop-accent)]">Material</p>
                <p className="text-sm font-medium text-[var(--shop-text)]">{content.materialTitle || 'Premium fabric'}</p>
                {content.materialNote ? <p className="anvl-micro mt-0.5 text-[var(--shop-text-muted)]">{content.materialNote}</p> : null}
              </div>
            </Tile>
          ) : null}

          {showCare ? (
            <Tile eyebrow="Care" className="md:col-span-1 md:row-span-1">
              <ul className="space-y-1 overflow-hidden text-xs text-[var(--shop-text-muted)]">
                {content.care.slice(0, 4).map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="text-[var(--shop-accent)]">·</span>
                    <span className="line-clamp-1">{c}</span>
                  </li>
                ))}
              </ul>
            </Tile>
          ) : null}

          {showSizeGuide ? (
            <Tile eyebrow="Fit & sizing" className="justify-between md:col-span-1 md:row-span-1" bg={content.sizeGuideDiagram}>
              {content.sizeGuideDiagram ? (
                <div aria-hidden="true" className="absolute inset-0 bg-[var(--shop-bg)]/70" />
              ) : null}
              <p className="relative z-10 text-xs leading-relaxed text-[var(--shop-text-muted)]">
                Measurements and fit notes for every size.
              </p>
              <Link
                to="/size-guide"
                className="anvl-micro focus-ring relative z-10 mt-2 inline-flex items-center gap-1.5 text-[var(--shop-text)] no-underline transition-colors hover:text-[var(--shop-accent)]"
              >
                Size guide
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </Tile>
          ) : null}

          {showColorways ? (
            <Tile eyebrow={`Colorways · ${variant.colorway?.name ?? ''}`} className="md:col-span-2 md:row-span-1">
              <div className="flex flex-wrap items-center gap-2">
                {product.colorways.map((c, i) => {
                  const active = i === colorwayIndex
                  const soldOut = colorHasNoStock(product, c.name)
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColorwayIndex(i)}
                      aria-pressed={active}
                      aria-label={`Select ${stripAngleBracketTags(c.name)}${soldOut ? ' (sold out)' : ''}`}
                      title={stripAngleBracketTags(c.name)}
                      className={cn(
                        'focus-ring relative grid h-8 w-8 place-items-center rounded-full ring-1 transition-transform',
                        soldOut && 'opacity-40',
                        active ? 'scale-110 ring-2 ring-[var(--shop-accent)]' : 'ring-[var(--shop-card-border)] hover:scale-110',
                      )}
                      style={{ backgroundColor: c.base, boxShadow: `inset 0 0 0 2px ${c.accent}33` }}
                    >
                      {active ? <Check size={13} aria-hidden="true" style={{ color: '#fff', mixBlendMode: 'difference' }} /> : null}
                      <span className="sr-only">{stripAngleBracketTags(c.name)}</span>
                    </button>
                  )
                })}
              </div>
            </Tile>
          ) : null}

          {showDetails ? (
            <Tile eyebrow="Forged details" className="md:col-span-2 md:row-span-1">
              <ul className="grid grid-cols-1 gap-x-4 gap-y-1 overflow-hidden sm:grid-cols-2">
                {content.designDetails.slice(0, 6).map((detail, i) => (
                  <li key={detail} className="flex gap-2 text-xs text-[var(--shop-text-muted)]">
                    <span className="anvl-display shrink-0 text-[var(--shop-accent)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-1">{detail}</span>
                  </li>
                ))}
              </ul>
            </Tile>
          ) : null}

          {showStoryBook ? (
            <Tile className="justify-between md:col-span-2 md:row-span-1">
              <div className="relative z-10">
                <p className="anvl-display mb-1 text-[10px] tracking-[0.26em] text-[var(--shop-accent)]">
                  The Saga
                </p>
                <p className="anvl-heading text-lg font-normal leading-snug text-[var(--shop-text)]">
                  Every piece carries a story. Open {product.name}&rsquo;s book.
                </p>
              </div>
              <Link
                to="/story"
                search={{ product: product.slug }}
                className="anvl-micro focus-ring relative z-10 mt-2 inline-flex items-center gap-1.5 text-[var(--shop-text)] no-underline transition-colors hover:text-[var(--shop-accent)]"
              >
                Read the story
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </Tile>
          ) : null}

          {youtube ? (
            <Tile className="overflow-hidden p-0 md:col-span-4 md:row-span-2">
              <div className="aspect-video h-full w-full bg-black">
                <iframe
                  title={`${product.name} video`}
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${youtube}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </Tile>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
