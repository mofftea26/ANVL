import { useMemo, useRef } from 'react'
import type { CmsMaterialItem } from '@/features/cms/landing/landingPageCms.types'
import { Container } from '@/shared/components/ui/Container'
import { gsap, useGSAP } from '@/shared/lib/gsap'

interface MaterialsMarqueeProps {
  actLabel: string
  counterSuffix: string
  heading: string
  intro: string
  materials: CmsMaterialItem[]
}

const SWATCH_GRADIENTS = [
  'linear-gradient(135deg, #0b0b0c 0%, #1d1f21 100%)',
  'linear-gradient(135deg, #34373a 0%, #0b0b0c 100%)',
  'linear-gradient(135deg, #1d1f21 0%, #5b5e61 100%)',
  'linear-gradient(135deg, #e7e4df 0%, #bab8b3 100%)',
  'linear-gradient(135deg, #0b0b0c 0%, #5b5e61 100%)',
]

/**
 * Act V — Materials & Quality.
 *
 * Editorial mosaic: featured first material in a hero card, the
 * rest in a tight grid below. No horizontal pinning — it was the
 * worst offender for scroll-jank earlier. Entrance-only animations,
 * transform + opacity only.
 */
export function MaterialsMarquee({
  actLabel,
  counterSuffix,
  heading,
  intro,
  materials,
}: MaterialsMarqueeProps) {
  const root = useRef<HTMLElement | null>(null)
  const visibleMaterials = useMemo(
    () => materials.filter((material) => material.isVisible !== false),
    [materials],
  )
  const { featured, rest } = useMemo(() => {
    const featuredItem =
      visibleMaterials.find((material) => material.isFeatured) ??
      visibleMaterials[0] ??
      null
    const remaining = visibleMaterials.filter(
      (material) => material !== featuredItem,
    )
    return { featured: featuredItem, rest: remaining }
  }, [visibleMaterials])

  useGSAP(
    () => {
      const ctx = gsap.matchMedia()

      // RESP-03 — gate timelines on both viewport AND reduced motion so
      // mobile users get the static final state by default.
      ctx.add(
        {
          motionOk: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          reduced: '(max-width: 767px), (prefers-reduced-motion: reduce)',
        },
        (context) => {
          const conds = context.conditions ?? {}
          const reduced = Boolean(conds.reduced)
          const host = root.current
          if (!host) return

          const eyebrow = host.querySelector('[data-mm-eyebrow]')
          const counter = host.querySelector('[data-mm-counter]')
          const headingWords = gsap.utils.toArray<HTMLElement>(
            '[data-mm-word]',
            host,
          )
          const intro = host.querySelector('[data-mm-intro]')
          const cards = gsap.utils.toArray<HTMLElement>('[data-mm-card]', host)

          if (reduced) {
            gsap.set(
              [eyebrow, counter, intro, ...headingWords, ...cards],
              { opacity: 1, y: 0, scale: 1 },
            )
            return
          }

          gsap.set(eyebrow, { opacity: 0, y: 14 })
          gsap.set(counter, { opacity: 0, y: 14 })
          gsap.set(headingWords, { yPercent: 100, opacity: 0 })
          gsap.set(intro, { opacity: 0, y: 14 })
          gsap.set(cards, { opacity: 0, y: 36 })

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
            .to(
              headingWords,
              {
                yPercent: 0,
                opacity: 1,
                duration: 0.9,
                stagger: 0.06,
              },
              0.1,
            )
            .to(intro, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
            .to(
              cards,
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.08,
                ease: 'expo.out',
              },
              0.4,
            )
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
      className="anvl-screen-section relative w-full overflow-hidden border-b border-[var(--color-line)] py-16 sm:py-20 md:py-24"
      aria-label="Materials and quality"
    >
      <div
        aria-hidden="true"
        className="anvl-grid-overlay pointer-events-none absolute inset-0 z-0"
      />

      <Container className="relative z-10">
        <div className="flex items-baseline justify-between gap-4">
          <p
            data-mm-eyebrow="true"
            className="anvl-micro will-change-transform"
          >
            {actLabel}
          </p>
          <p
            data-mm-counter="true"
            className="anvl-micro text-[var(--color-text-muted)] will-change-transform"
          >
            {String(visibleMaterials.length).padStart(2, '0')} · {counterSuffix}
          </p>
        </div>

        <div className="mt-6 grid gap-8 sm:mt-8 md:grid-cols-[1.1fr_1fr] md:items-end md:gap-10 lg:gap-14">
          <h2 className="anvl-heading font-normal leading-[0.9] text-[clamp(1.875rem,6vw,4rem)]">
            {heading.split(' ').map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="mr-2 inline-block overflow-hidden pb-[0.06em] align-baseline"
              >
                <span
                  data-mm-word="true"
                  className="inline-block will-change-transform"
                >
                  {word}
                </span>
              </span>
            ))}
          </h2>

          <p
            data-mm-intro="true"
            className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] will-change-transform sm:text-[15px]"
          >
            {intro}
          </p>
        </div>

        {featured ? (
          <article
            data-mm-card="true"
            className="mt-10 grid gap-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 will-change-transform sm:gap-6 sm:p-7 md:grid-cols-[160px_1fr] md:items-center md:gap-8"
          >
            <span
              aria-hidden="true"
              className="block h-28 w-28 rounded-full border border-[var(--color-line)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] md:h-36 md:w-36"
              style={{ background: SWATCH_GRADIENTS[0] }}
            />
            <div>
              <p className="anvl-micro text-[var(--color-accent)]">
                {featured.code} · Hero material
              </p>
              <h3 className="anvl-heading mt-3 text-2xl font-normal leading-tight sm:text-3xl md:text-4xl">
                {featured.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                {featured.description}
              </p>
            </div>
          </article>
        ) : null}

        {rest.length ? (
          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            {rest.map((material, i) => (
              <article
                key={material.id}
                data-mm-card="true"
                className="group relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors will-change-transform hover:border-[var(--color-accent)]/40 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="anvl-micro text-[var(--color-accent)]">
                    {material.code}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-block h-8 w-8 shrink-0 rounded-full border border-[var(--color-line)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
                    style={{
                      background:
                        SWATCH_GRADIENTS[(i + 1) % SWATCH_GRADIENTS.length],
                    }}
                  />
                </div>
                <h3 className="anvl-heading mt-3 text-lg font-normal leading-tight sm:text-xl">
                  {material.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {material.description}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
