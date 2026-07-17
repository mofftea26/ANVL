import { ChevronLeft, ChevronRight, Expand } from '@/shared/icons'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { IconButton } from '@/shared/components/ui/IconButton'
import { ShopSurfaceScope } from '@/shared/components/layout/ShopSurfaceScope'
import { cn } from '@/shared/lib/cn'
import { DEFAULT_EMBLEM_SRC, isBundledPlaceholderImage } from '@/shared/constants/brandAssets'
import { withShopifyImageWidth } from '@/shared/lib/url'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/** Main image fills its column (up to ~700 CSS px); covers retina at that size. */
const MAIN_IMAGE_WIDTH = 1400
/** Thumbnail rail / mobile carousel frames render small. */
const THUMBNAIL_IMAGE_WIDTH = 400

const PdpLightbox = lazy(() =>
  import('@/features/products/pdp/PdpLightbox').then((m) => ({ default: m.PdpLightbox })),
)

export type PdpGalleryImage = { src: string; alt: string }

/**
 * PDP gallery. The product image *floats* — no card/border — over the shop
 * surface with a soft contact shadow and a subtle 3D tilt on hover. Desktop: a
 * large main image (zoom + click-to-expand lightbox) that fills its column so
 * it matches the buy-panel height, with a thumbnail rail beneath. Mobile: a
 * native scroll-snap swipe carousel with dots. Colorway-aware (the parent passes
 * the active colorway's images). LCP-friendly: first image eager, rest lazy.
 * Falls back to the bundled emblem only when there is no real photo and no CMS
 * gallery fallback.
 */
export function PdpGallery({
  images,
  productName,
  galleryFallback,
}: {
  images: PdpGalleryImage[]
  productName: string
  galleryFallback?: string
}) {
  const real = images.filter((i) => !isBundledPlaceholderImage(i.src))
  const list: PdpGalleryImage[] =
    real.length > 0
      ? real
      : [{ src: galleryFallback || DEFAULT_EMBLEM_SRC, alt: `${productName} placeholder` }]
  const hasReal = real.length > 0

  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)

  // Reset when the colorway (image set) changes.
  useEffect(() => {
    setActive(0)
    trackRef.current?.scrollTo({ left: 0 })
  }, [images])

  const main = list[active] ?? list[0]
  const imgFloat =
    'object-contain drop-shadow-[0_28px_55px_rgba(0,0,0,0.5)] [filter:drop-shadow(0_28px_55px_rgba(0,0,0,0.5))]'

  return (
    <div className="space-y-3 lg:flex lg:h-full lg:flex-col lg:space-y-0">
      {/* Mobile: swipe carousel — floating, no card. */}
      <div className="lg:hidden">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget
            const i = Math.round(el.scrollLeft / el.clientWidth)
            if (i !== active) setActive(i)
          }}
        >
          {list.map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              className="relative aspect-[4/5] w-full shrink-0 snap-center"
            >
              <img
                src={withShopifyImageWidth(img.src, MAIN_IMAGE_WIDTH)}
                alt={img.alt || productName}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
                className={cn(
                  'absolute inset-0 h-full w-full',
                  hasReal ? imgFloat : 'object-contain p-10 opacity-70',
                )}
              />
            </div>
          ))}
        </div>
        {list.length > 1 ? (
          <div className="mt-2 flex justify-center gap-1.5">
            {list.map((img, i) => (
              <span
                key={`dot-${img.src}-${i}`}
                aria-hidden="true"
                className={cn('h-1.5 w-5 rounded-full transition-colors', i === active ? 'bg-[var(--shop-accent)]' : 'bg-[var(--shop-card-border)]')}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: floating main image (fills column height) + thumbnail rail. */}
      <div className="hidden lg:flex lg:h-full lg:flex-col lg:gap-3">
        <div className="group/main relative min-h-0 w-full flex-1 [perspective:1600px]">
          <div className="relative h-full w-full transition-transform duration-500 ease-out [transform-style:preserve-3d] motion-safe:group-hover/main:[transform:rotateX(3.5deg)_rotateY(-5deg)_scale(1.015)]">
            <img
              src={main?.src ? withShopifyImageWidth(main.src, MAIN_IMAGE_WIDTH) : main?.src}
              alt={main?.alt || productName}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={cn(
                'h-full w-full',
                hasReal ? imgFloat : 'object-contain p-16 opacity-70',
              )}
            />

            {hasReal ? (
              <button
                type="button"
                onClick={() => setLightbox(true)}
                aria-label={`Expand & zoom ${productName} image`}
                className="focus-ring absolute inset-0 cursor-zoom-in"
              />
            ) : null}

            {hasReal && list.length > 1 ? (
              <ShopSurfaceScope className="contents">
                <IconButton
                  variant="overlay"
                  size="sm"
                  onClick={() => setActive((i) => (i - 1 + list.length) % list.length)}
                  aria-label="Previous image"
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover/main:opacity-100"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </IconButton>
                <IconButton
                  variant="overlay"
                  size="sm"
                  onClick={() => setActive((i) => (i + 1) % list.length)}
                  aria-label="Next image"
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover/main:opacity-100"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </IconButton>
              </ShopSurfaceScope>
            ) : null}

            {hasReal ? (
              <span className="anvl-micro pointer-events-none absolute bottom-1 right-1 z-10 inline-flex items-center gap-1.5 rounded-full bg-[var(--shop-overlay)] px-2.5 py-1 text-[0.6rem] text-[var(--shop-text)] opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover/main:opacity-100">
                <Expand size={ICON_SIZE.xs} aria-hidden="true" /> Zoom
              </span>
            ) : null}
          </div>
        </div>

        {list.length > 1 ? (
          <div className="grid shrink-0 grid-cols-5 gap-2">
            {list.map((img, i) => (
              <button
                key={`thumb-${img.src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View ${productName} image ${i + 1}`}
                aria-pressed={i === active}
                className={cn(
                  'focus-ring aspect-square overflow-hidden rounded-md p-1 ring-1 transition-all',
                  i === active
                    ? 'ring-[var(--shop-accent)]'
                    : 'opacity-60 ring-transparent hover:opacity-100',
                )}
              >
                <img
                  src={withShopifyImageWidth(img.src, THUMBNAIL_IMAGE_WIDTH)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightbox ? (
        <Suspense fallback={null}>
          <PdpLightbox
            images={list}
            index={active}
            productName={productName}
            onIndexChange={setActive}
            onClose={() => setLightbox(false)}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
