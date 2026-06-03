import type { Ref } from 'react'

import type { Product } from '@/features/products/types/product.types'

import {

  formatProductPrice,

  productAvailabilityLabel,

  resolveProductHref,

} from '@/features/marketing/act-presets/productShowcase/oathProductUtils'

import { cn } from '@/shared/lib/cn'

import { useProductCardParallaxTilt } from './useProductCardParallaxTilt'



export type ProductShowcaseCardProps = {

  product: Product

  index: number

  /** Pinned beat: compact horizontal banner inside a flex row. */

  strip?: boolean

}



/**

 * Cinematic product banner — horizontal strip with editorial overlay type,

 * desktop mouse tilt (GSAP-gated), CSS hover depth on mobile.

 */

export function ProductShowcaseCard({ product, index, strip = false }: ProductShowcaseCardProps) {

  const { cardRef, imgRef } = useProductCardParallaxTilt()

  const img = product.images[0]

  const href = resolveProductHref(product)

  const indexLabel = String(index + 1).padStart(2, '0')

  const isAvailable = product.shop?.storefrontStatus !== 'outOfStock'



  return (

    <article

      data-brand-product

      className={cn(

        'group pointer-events-auto relative min-h-0 w-full will-change-[transform,opacity,filter]',

        strip && 'flex h-full min-h-0 items-stretch',

      )}

    >

      <div

        className={cn(

          'brand-product-banner__scale w-full min-h-0',

          strip ? 'h-full max-h-full' : 'h-auto',

        )}

      >

        <div

          ref={cardRef as Ref<HTMLDivElement>}

          className={cn(

            'relative mx-auto w-full min-h-0 [transform-style:preserve-3d]',

            strip

              ? 'h-full max-h-[min(14svh,5.5rem)] sm:max-h-[min(16svh,6.25rem)] md:max-h-[min(18svh,7rem)]'

              : 'aspect-[5/2] max-h-[min(22dvh,7.5rem)] sm:max-h-[min(20dvh,8rem)]',

          )}

        >

          <a

            href={href}

            target="_blank"

            rel="noopener noreferrer"

            className={cn(

              'brand-product-banner relative flex h-full w-full min-h-0 overflow-hidden rounded-[1px]',

              'transition-[box-shadow,transform] duration-500 ease-out',

              'hover:shadow-[0_0_48px_-12px_color-mix(in_srgb,var(--color-accent)_42%,transparent),0_16px_36px_-20px_rgba(0,0,0,0.88)]',

              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',

            )}

          >

            <div

              ref={imgRef}

              data-brand-product-img

              className="absolute inset-y-0 left-0 w-[46%] min-w-[38%] max-w-[52%] overflow-hidden will-change-transform"

              aria-hidden

            >

              {img ? (

                <img

                  src={img.src}

                  alt=""

                  className="size-full object-cover object-[center_22%] transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.08] group-hover:brightness-[1.08]"

                  loading="lazy"

                />

              ) : (

                <div className="relative size-full bg-gradient-to-br from-[var(--color-surface-elevated)] via-[var(--color-bg)] to-black">

                  <div className="absolute inset-0 opacity-55 bg-[radial-gradient(ellipse_90%_70%_at_24%_18%,color-mix(in_srgb,var(--color-accent)_28%,transparent),transparent_58%)]" />

                  <div className="absolute inset-0 flex items-end justify-start p-2">

                    <span className="font-display text-[clamp(1.75rem,8cqi,2.75rem)] uppercase leading-none tracking-[0.06em] text-[color-mix(in_srgb,var(--color-accent)_28%,var(--color-muted))]">

                      {product.name.slice(0, 1)}

                    </span>

                  </div>

                </div>

              )}

              <div

                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/55"

                aria-hidden

              />

            </div>



            <div

              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-black/72"

              aria-hidden

            />

            <div

              className="brand-product-banner__accent pointer-events-none absolute inset-0"

              aria-hidden

            />

            <div

              className="brand-product-banner__rail pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px]"

              aria-hidden

            />

            <div className="brand-product-banner__frame pointer-events-none absolute inset-0 z-10" aria-hidden />



            <span

              className="brand-product-banner__wm pointer-events-none absolute right-1 top-1/2 z-0 -translate-y-1/2 font-display leading-none tracking-[0.02em] text-[color-mix(in_srgb,var(--color-fg)_6%,transparent)] select-none"

              aria-hidden

            >

              {indexLabel}

            </span>



            <div className="relative z-20 ml-[38%] flex h-full min-h-0 w-full flex-col justify-center px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3">

              <div className="flex items-center justify-between gap-1.5">

                <span className="font-display text-[clamp(0.58rem,2cqi,0.82rem)] tabular-nums leading-none tracking-[0.28em] text-[var(--color-accent)] drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">

                  {indexLabel}

                </span>

                <span className="max-w-[52%] truncate text-right text-[0.4rem] uppercase leading-tight tracking-[0.2em] text-[color-mix(in_srgb,var(--color-fg)_62%,transparent)] sm:text-[0.44rem]">

                  {product.dropName}

                </span>

              </div>



              <h3 className="mt-1 font-display text-left text-[clamp(0.72rem,min(2.8vw,3.2cqi),1.05rem)] uppercase leading-[0.88] tracking-[0.03em] text-balance text-[var(--color-fg)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">

                {product.name}

              </h3>



              <div className="mt-1 flex items-center justify-between gap-1.5">

                <span className="font-display text-[clamp(0.6rem,2cqi,0.82rem)] tabular-nums leading-none text-[var(--color-fg)] drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]">

                  {formatProductPrice(product)}

                </span>

                <div className="flex shrink-0 items-center gap-1">

                  <span

                    className={cn(

                      'border px-1 py-px text-[0.38rem] uppercase leading-none tracking-[0.16em] backdrop-blur-[2px] sm:text-[0.42rem]',

                      isAvailable

                        ? 'border-[color-mix(in_srgb,var(--color-accent)_42%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[color-mix(in_srgb,var(--color-accent)_90%,var(--color-fg))]'

                        : 'border-[color-mix(in_srgb,var(--color-line)_55%,transparent)] bg-black/30 text-[var(--color-muted)]',

                    )}

                  >

                    {productAvailabilityLabel(product)}

                  </span>

                  <span className="font-display text-[0.38rem] uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--color-accent)_75%,var(--color-muted))] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 sm:text-[0.42rem]">

                    View →

                  </span>

                </div>

              </div>

            </div>



            {img ? (

              <span className="sr-only">

                {product.name} — {formatProductPrice(product)}

              </span>

            ) : null}

          </a>

        </div>

      </div>

    </article>

  )

}

