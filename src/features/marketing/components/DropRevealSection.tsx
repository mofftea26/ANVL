import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { AnvlWordmark } from '@/shared/assets/brand'
import { Container } from '@/shared/components/ui/Container'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import type { Product } from '@/features/products/types/product.types'

/**
 * Act III — Drop 01: The Oath.
 *
 * Typographic monolith that names the drop. Eyebrow, mask-reveal
 * heading ("DROP / 01 / THE / OATH"), tagline, stats strip, and CTAs.
 * A faded crest sits silently behind the type; an Oath shape
 * parallaxes very slightly through the viewport for depth without
 * fighting the scroll.
 */
export function DropRevealSection({ products }: { products: Product[] }) {
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

          const eyebrow = host.querySelector('[data-drop-eyebrow]')
          const counter = host.querySelector('[data-drop-counter]')
          const monolith = host.querySelector('[data-drop-monolith]')
          const words = gsap.utils.toArray<HTMLElement>('[data-drop-word]', host)
          const tagline = host.querySelector('[data-drop-tagline]')
          const stats = gsap.utils.toArray<HTMLElement>('[data-drop-stat]', host)
          const cta = host.querySelector('[data-drop-cta]')

          if (reduced) {
            gsap.set(
              [eyebrow, counter, monolith, tagline, cta, ...words, ...stats],
              { opacity: 1, y: 0, x: 0, scale: 1 },
            )
            return
          }

          gsap.set(eyebrow, { opacity: 0, y: 14 })
          gsap.set(counter, { opacity: 0, y: 14 })
          gsap.set(monolith, { opacity: 0, scale: 0.9 })
          gsap.set(words, { yPercent: 100, opacity: 0 })
          gsap.set(tagline, { opacity: 0, y: 14 })
          gsap.set(stats, { opacity: 0, y: 18 })
          gsap.set(cta, { opacity: 0, y: 14 })

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
            .to(counter, { opacity: 1, y: 0, duration: 0.6 }, 0.05)
            .to(monolith, { opacity: 1, scale: 1, duration: 1.3 }, 0.1)
            .to(
              words,
              {
                yPercent: 0,
                opacity: 1,
                duration: 0.95,
                stagger: 0.09,
              },
              0.25,
            )
            .to(tagline, { opacity: 1, y: 0, duration: 0.6 }, 0.7)
            .to(
              stats,
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.06,
                ease: 'power3.out',
              },
              0.85,
            )
            .to(cta, { opacity: 1, y: 0, duration: 0.6 }, 1.0)

          if (monolith) {
            gsap.fromTo(
              monolith,
              { yPercent: -4 },
              {
                yPercent: 4,
                ease: 'none',
                scrollTrigger: {
                  trigger: host,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            )
          }
        },
        root,
      )

      return () => ctx.revert()
    },
    { scope: root },
  )

  const stats = [
    { label: 'Pieces', value: String(products.length).padStart(2, '0') },
    { label: 'Edition', value: 'Numbered' },
    { label: 'Run', value: 'Limited' },
  ]

  return (
    <section
      ref={root}
      className="anvl-screen-section relative w-full overflow-hidden border-b border-[var(--color-line)] py-16 sm:py-20 md:py-24"
      aria-label="Drop 01: The Oath unveiling"
    >
      {/* ANVL wordmark watermark — silent backdrop behind the type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <span data-drop-monolith="true" className="block w-full will-change-transform">
          <AnvlWordmark className="block w-[140%] -translate-x-[14%] text-[var(--color-heading)] opacity-[0.07] sm:w-[125%] sm:-translate-x-[12%] md:w-[115%] md:-translate-x-[7%] lg:w-[105%] lg:-translate-x-[2%]" />
        </span>
      </div>

      <Container className="relative z-10">
        <div className="flex items-baseline justify-between gap-4">
          <p
            data-drop-eyebrow="true"
            className="anvl-micro will-change-transform"
          >
            Act III — The Drop
          </p>
          <p
            data-drop-counter="true"
            className="anvl-micro text-[var(--color-text-muted)] will-change-transform"
          >
            01 / 01
          </p>
        </div>

        <h2 className="anvl-heading mt-6 font-normal leading-[0.84] tracking-[-0.01em] text-[clamp(2.5rem,11vw,8.5rem)] sm:mt-8">
          {['DROP', '01', 'THE', 'OATH'].map((word) => (
            <span
              key={word}
              className="mr-3 inline-block overflow-hidden pb-[0.06em] align-baseline"
            >
              <span
                data-drop-word="true"
                className="inline-block will-change-transform"
              >
                {word}
              </span>
            </span>
          ))}
        </h2>

        <p
          data-drop-tagline="true"
          className="mt-6 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] will-change-transform sm:mt-8 sm:text-[15px] md:text-base"
        >
          The first ANVL release. Three forged pieces — built for serious
          lifters, finished for streetwear hours. Numbered, limited, and
          made to be worn through pressure.
        </p>

        <dl className="mt-8 grid grid-cols-3 gap-3 border-y border-[var(--color-line)] py-5 sm:mt-10 sm:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              data-drop-stat="true"
              className="will-change-transform"
            >
              <dt className="anvl-micro text-[var(--color-text-muted)]">
                {stat.label}
              </dt>
              <dd className="anvl-heading mt-1 text-xl font-normal leading-tight sm:text-2xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <div
          data-drop-cta="true"
          className="mt-6 flex flex-wrap items-center gap-3 will-change-transform sm:mt-8"
        >
          <Link
            to="/drop/the-oath"
            className="focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-bg)] no-underline transition-transform hover:-translate-y-0.5"
          >
            Explore Drop 01
          </Link>
          <Link
            to="/shop"
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]/70 px-5 text-sm font-semibold no-underline backdrop-blur transition-transform hover:-translate-y-0.5"
          >
            View the pieces
            <span aria-hidden="true">↓</span>
          </Link>
        </div>
      </Container>
    </section>
  )
}
