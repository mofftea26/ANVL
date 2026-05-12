import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import type { Product } from '@/features/products/types/product.types'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { Container } from '@/shared/components/ui/Container'
import { gsap, useGSAP } from '@/shared/lib/gsap'

interface PiecesGridProps {
  products: Product[]
}

/**
 * Act IV — The Pieces.
 *
 * Compact product showcase that follows the drop unveiling. Three
 * uniform mini-cards (4:5 image + name + price) sit in a single
 * 3-column grid across every breakpoint. Width is capped so the
 * row reads as a tight editorial strip rather than a shop page.
 */
export function PiecesGrid({ products }: PiecesGridProps) {
  const root = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const ctx = gsap.matchMedia()

      ctx.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const conds = context.conditions ?? {}
          const reduced = Boolean(conds.reduced)
          const host = root.current
          if (!host) return

          const eyebrow = host.querySelector('[data-pieces-eyebrow]')
          const headingWords = gsap.utils.toArray<HTMLElement>(
            '[data-pieces-word]',
            host,
          )
          const meta = host.querySelector('[data-pieces-meta]')
          const cards = gsap.utils.toArray<HTMLElement>(
            '[data-pieces-card]',
            host,
          )
          const footer = host.querySelector('[data-pieces-footer]')

          if (reduced) {
            gsap.set([eyebrow, meta, footer, ...headingWords, ...cards], {
              opacity: 1,
              y: 0,
              scale: 1,
            })
            return
          }

          gsap.set(eyebrow, { opacity: 0, y: 14 })
          gsap.set(meta, { opacity: 0, y: 14 })
          gsap.set(headingWords, { yPercent: 100, opacity: 0 })
          gsap.set(cards, { opacity: 0, y: 40 })
          gsap.set(footer, { opacity: 0, y: 14 })

          gsap
            .timeline({
              scrollTrigger: {
                trigger: host,
                start: 'top bottom-=160',
                toggleActions: 'play none none reverse',
              },
              defaults: { ease: 'expo.out' },
            })
            .to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0)
            .to(
              headingWords,
              {
                yPercent: 0,
                opacity: 1,
                duration: 0.9,
                stagger: 0.07,
              },
              0.1,
            )
            .to(meta, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
            .to(
              cards,
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'expo.out',
              },
              0.4,
            )
            .to(footer, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
        },
        root,
      )

      return () => ctx.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      className="relative w-full overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-surface)] py-12 sm:py-14 md:py-16"
      aria-label="Drop 01 pieces"
    >
      <Container className="relative z-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p
              data-pieces-eyebrow="true"
              className="anvl-micro will-change-transform"
            >
              Act IV — The Pieces
            </p>
            <h2 className="anvl-heading mt-2 font-normal leading-[0.9] text-[clamp(1.75rem,6vw,3.75rem)]">
              <span className="block">
                {'Three pieces.'.split(' ').map((word) => (
                  <span
                    key={word}
                    className="mr-2 inline-block overflow-hidden pb-[0.04em] align-baseline"
                  >
                    <span
                      data-pieces-word="true"
                      className="inline-block will-change-transform"
                    >
                      {word}
                    </span>
                  </span>
                ))}
              </span>
              <span className="block">
                {'One oath.'.split(' ').map((word) => (
                  <span
                    key={word}
                    className="mr-2 inline-block overflow-hidden pb-[0.04em] align-baseline"
                  >
                    <span
                      data-pieces-word="true"
                      className="inline-block will-change-transform"
                    >
                      {word}
                    </span>
                  </span>
                ))}
              </span>
            </h2>
          </div>

          <Link
            data-pieces-meta="true"
            to="/shop"
            className="anvl-micro inline-flex items-center gap-2 self-start will-change-transform sm:self-end"
          >
            View all
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-3 gap-3 sm:mt-10 sm:gap-5">
          {products.map((product, index) => (
            <Link
              key={product.id}
              data-pieces-card="true"
              to="/shop/$slug"
              params={{ slug: product.slug }}
              className="group flex flex-col overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] no-underline transition will-change-transform hover:-translate-y-0.5"
            >
              <div className="relative aspect-[4/5] overflow-hidden border-b border-[var(--color-line)]">
                <img
                  src={
                    product.images[0]?.src ?? '/brand/placeholder-product.svg'
                  }
                  alt={
                    product.images[0]?.alt ??
                    `${product.name} editorial placeholder`
                  }
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <AnvlCompactMark
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-2 h-4 w-auto text-[var(--color-heading)] opacity-30 mix-blend-overlay"
                />
                <span className="anvl-micro pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/70 px-2 py-0.5 text-[10px] text-[var(--color-text-muted)] backdrop-blur">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-1 p-2 sm:p-3">
                <h3 className="anvl-heading truncate text-xs font-normal leading-tight sm:text-sm md:text-base">
                  {product.name}
                </h3>
                <p className="shrink-0 text-[10px] text-[var(--color-text-muted)] sm:text-xs">
                  ${product.price}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div
          data-pieces-footer="true"
          className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--color-line)] pt-4 will-change-transform sm:mt-8"
        >
          <p className="anvl-micro text-[var(--color-text-muted)]">
            Numbered editions · Drop 01
          </p>
          <Link
            to="/drop/the-oath"
            className="anvl-micro inline-flex items-center gap-2 text-[var(--color-heading)] no-underline underline-offset-4 hover:underline"
          >
            Drop story
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Container>
    </section>
  )
}
