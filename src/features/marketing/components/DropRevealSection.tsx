import { useRef, type CSSProperties } from 'react'
import type {
  CmsCta,
  CmsStatItem,
  LandingDropIcon,
} from '@/features/cms/landing/landingPageCms.types'
import { AnvlWordmark } from '@/shared/assets/brand'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import type { Product } from '@/features/products/types/product.types'
import {
  ACT_RESPONSIVE_CLASS,
  ACT_RESPONSIVE_STYLE,
  LEGACY_ACT_SECTION_CLASS,
} from '@/features/marketing/act-presets/shared/actResponsiveTokens'
import { cn } from '@/shared/lib/cn'

interface DropRevealSectionProps {
  products: Product[]
  actLabel: string
  counterLabel: string
  words: string[]
  tagline: string
  stats: CmsStatItem[]
  primaryCta?: CmsCta | null
  secondaryCta?: CmsCta | null
  dropIcon: LandingDropIcon
}

/**
 * Act III — Drop 01: The Oath.
 *
 * Typographic monolith that names the drop. Eyebrow, mask-reveal
 * heading ("DROP / 01 / THE / OATH"), optional CMS drop icon, tagline,
 * stats strip, and CTAs.
 * A faded crest sits silently behind the type; an Oath shape
 * parallaxes very slightly through the viewport for depth without
 * fighting the scroll.
 */
export function DropRevealSection({
  products,
  actLabel,
  counterLabel,
  words,
  tagline,
  stats,
  primaryCta,
  secondaryCta,
  dropIcon,
}: DropRevealSectionProps) {
  const root = useRef<HTMLElement | null>(null)
  const showDropIcon = Boolean(dropIcon.src.trim())
  const resolvedStats: CmsStatItem[] =
    stats.length > 0
      ? stats
      : [
          {
            id: 'drop-stat-pieces',
            label: 'Pieces',
            value: String(products.length).padStart(2, '0'),
          },
          { id: 'drop-stat-edition', label: 'Edition', value: 'Numbered' },
          { id: 'drop-stat-run', label: 'Run', value: 'Limited' },
        ]
  const resolvedWords = words.length > 0 ? words : ['DROP', '01', 'THE', 'OATH']
  const showCtas = Boolean(primaryCta?.label?.trim() || secondaryCta?.label?.trim())

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

          const eyebrow = host.querySelector('[data-drop-eyebrow]')
          const counter = host.querySelector('[data-drop-counter]')
          const monolith = host.querySelector('[data-drop-monolith]')
          const words = gsap.utils.toArray<HTMLElement>('[data-drop-word]', host)
          const tagline = host.querySelector('[data-drop-tagline]')
          const stats = gsap.utils.toArray<HTMLElement>('[data-drop-stat]', host)
          const cta = host.querySelector('[data-drop-cta]')
          const dropIconWrap = host.querySelector('[data-drop-icon]')

          if (reduced) {
            const reducedTargets = [
              eyebrow,
              counter,
              monolith,
              tagline,
              cta,
              dropIconWrap,
              ...words,
              ...stats,
            ].filter((el): el is Element => Boolean(el))
            gsap.set(reducedTargets, { opacity: 1, y: 0, x: 0, scale: 1 })
            return
          }

          gsap.set(eyebrow, { opacity: 0, y: 14 })
          gsap.set(counter, { opacity: 0, y: 14 })
          gsap.set(monolith, { opacity: 0, scale: 0.9 })
          gsap.set(words, { yPercent: 100, opacity: 0 })
          if (dropIconWrap) gsap.set(dropIconWrap, { opacity: 0, y: 14 })
          gsap.set(tagline, { opacity: 0, y: 14 })
          gsap.set(stats, { opacity: 0, y: 18 })
          gsap.set(cta, { opacity: 0, y: 14 })

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: host,
              start: 'top bottom-=160',
              toggleActions: 'play none none reverse',
            },
            defaults: { ease: 'expo.out' },
          })

          tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0)
            .to(counter, { opacity: 1, y: 0, duration: 0.6 }, 0.05)
            .to(monolith, { opacity: 1, scale: 1, duration: 1.3 }, 0.1)
          if (dropIconWrap) {
            tl.to(
              dropIconWrap,
              { opacity: 1, y: 0, duration: 0.65 },
              0.12,
            )
          }
          tl.to(
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
    { scope: root, dependencies: [showDropIcon, dropIcon.src] },
  )

  return (
    <section
      ref={root}
      className={cn(LEGACY_ACT_SECTION_CLASS, ACT_RESPONSIVE_CLASS, 'anvl-act-section--reveal')}
      style={ACT_RESPONSIVE_STYLE as CSSProperties}
      aria-label="Drop 01: The Oath unveiling"
    >
      {/* ANVL wordmark watermark — silent backdrop behind the type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <span data-drop-monolith="true" className="block w-full will-change-transform">
          <AnvlWordmark className="block w-[110%] -translate-x-[5%] text-[var(--color-heading)] opacity-[0.04] sm:w-[100%] sm:translate-x-0 md:w-[92%]" />
        </span>
      </div>

      <Container className="anvl-act-content relative z-10 flex flex-col justify-center py-4 sm:py-5 md:py-6">
        <div className="flex items-baseline justify-between gap-4">
          <p
            data-drop-eyebrow="true"
            className="anvl-micro will-change-transform"
          >
            {actLabel}
          </p>
          <p
            data-drop-counter="true"
            className="anvl-micro text-[var(--color-text-muted)] will-change-transform"
          >
            {counterLabel}
          </p>
        </div>

        {showDropIcon ? (
          <div
            data-drop-icon="true"
            className="mt-3 flex justify-start will-change-transform sm:mt-4"
          >
            <img
              src={dropIcon.src}
              alt={dropIcon.alt.trim() ? dropIcon.alt : 'Drop mark'}
              className="h-8 w-auto max-h-[2.25rem] max-w-[min(100%,8rem)] object-contain opacity-70"
              decoding="async"
              loading="lazy"
            />
          </div>
        ) : null}

        <h2 data-act-display className="anvl-display mt-4 font-normal leading-[0.88] tracking-[-0.01em] sm:mt-5">
          {resolvedWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
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
          className="mt-4 max-w-xl text-xs leading-relaxed text-[var(--color-text-muted)] will-change-transform sm:mt-5 sm:text-sm"
        >
          {tagline}
        </p>

        <dl
          className="mt-5 grid gap-2 border-y border-[var(--color-line)] py-3 sm:mt-6 sm:gap-4 sm:py-4"
          style={{
            gridTemplateColumns: `repeat(${Math.max(resolvedStats.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {resolvedStats.map((stat) => (
            <div
              key={stat.id}
              data-drop-stat="true"
              className="will-change-transform"
            >
              <dt className="anvl-micro text-[var(--color-text-muted)]">
                {stat.label}
              </dt>
              <dd data-act-stat className="anvl-heading mt-0.5 font-normal leading-tight">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        {showCtas ? (
          <div
            data-drop-cta="true"
            className="mt-4 flex flex-wrap items-center gap-2 will-change-transform sm:mt-5"
          >
            {primaryCta?.label?.trim() ? (
              <SafeLink
                href={primaryCta.href}
                className="focus-ring inline-flex h-9 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-xs font-semibold text-[var(--color-bg)] no-underline sm:text-sm"
              >
                {primaryCta.label}
              </SafeLink>
            ) : null}
            {secondaryCta?.label?.trim() ? (
              <SafeLink
                href={secondaryCta.href}
                className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]/70 px-4 text-xs font-semibold no-underline backdrop-blur sm:text-sm"
              >
                {secondaryCta.label}
                <span aria-hidden="true">↓</span>
              </SafeLink>
            ) : null}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
