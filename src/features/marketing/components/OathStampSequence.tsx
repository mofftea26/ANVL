import { useMemo, useRef } from 'react'
import type { CmsTenetItem } from '@/features/cms/landing/landingPageCms.types'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container } from '@/shared/components/ui/Container'
import { gsap, useGSAP } from '@/shared/lib/gsap'

interface OathStampSequenceProps {
  actLabel: string
  counterLabel?: string
  heading: string
  intro: string
  tenets: CmsTenetItem[]
  emblemSrc?: string
}

/**
 * Act II — The Manifesto.
 *
 * Editorial split: act label, mask-reveal heading and intro on the
 * left; numbered tenets ledger on the right. Section sits at
 * `min-height: 100svh - 4rem` with predictable vertical padding,
 * content flows top-to-bottom so the eyebrow always lands at the
 * top of the section regardless of viewport height.
 *
 * Animations are entrance-only and transforms-only. The Oath shape
 * in the background rotates slowly and parallaxes through the
 * viewport for ambient motion.
 */
export function OathStampSequence({
  actLabel,
  counterLabel,
  heading,
  intro,
  tenets,
  emblemSrc,
}: OathStampSequenceProps) {
  const root = useRef<HTMLElement | null>(null)
  const visibleTenets = useMemo(
    () => tenets.filter((tenet) => tenet.isVisible !== false),
    [tenets],
  )
  const resolvedCounter =
    counterLabel ?? `${String(visibleTenets.length).padStart(2, '0')} Tenets`

  useGSAP(
    () => {
      const ctx = gsap.matchMedia()

      // RESP-03 — gate timelines on both viewport AND reduced motion so
      // mobile users get the static final state by default. Matches the
      // HeroForgeSequence pattern.
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

          const eyebrow = host.querySelector('[data-oath-eyebrow]')
          const counter = host.querySelector('[data-oath-counter]')
          const headingWords = gsap.utils.toArray<HTMLElement>(
            '[data-oath-word]',
            host,
          )
          const intro = host.querySelector('[data-oath-intro]')
          const rule = host.querySelector('[data-oath-rule]')
          const tenets = gsap.utils.toArray<HTMLElement>(
            '[data-oath-tenet]',
            host,
          )
          const shape = host.querySelector('[data-oath-shape]')

          if (reduced) {
            gsap.set(
              [eyebrow, counter, intro, rule, ...headingWords, ...tenets],
              { opacity: 1, x: 0, y: 0, scaleX: 1 },
            )
            return
          }

          gsap.set(eyebrow, { opacity: 0, y: 14 })
          gsap.set(counter, { opacity: 0, y: 14 })
          gsap.set(headingWords, { yPercent: 100, opacity: 0 })
          gsap.set(intro, { opacity: 0, y: 14 })
          gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' })
          gsap.set(tenets, { opacity: 0, y: 20 })

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
                stagger: 0.07,
              },
              0.15,
            )
            .to(rule, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' }, 0.35)
            .to(intro, { opacity: 1, y: 0, duration: 0.6 }, 0.45)
            .to(
              tenets,
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.07,
                ease: 'power3.out',
              },
              0.5,
            )

          if (shape) {
            gsap.to(shape, {
              rotate: 360,
              duration: 180,
              repeat: -1,
              ease: 'none',
            })
            gsap.fromTo(
              shape,
              { yPercent: -6 },
              {
                yPercent: 6,
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

  return (
    <section
      ref={root}
      className="anvl-screen-section relative w-full overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-surface)] py-16 sm:py-20 md:py-24"
      aria-label="The Manifesto"
    >
      {/* Background Oath shape — centered, slow rotation. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <span
          data-oath-shape="true"
          className="block will-change-transform"
        >
          <DropEmblemDecor
            src={emblemSrc}
            presentationOnly
            className="h-[110svh] w-auto text-[var(--color-heading)] opacity-[0.04] md:opacity-[0.07]"
          />
        </span>
      </div>

      <Container className="relative z-10">
        <div className="flex items-baseline justify-between gap-4">
          <p data-oath-eyebrow="true" className="anvl-micro will-change-transform">
            {actLabel}
          </p>
          <p
            data-oath-counter="true"
            className="anvl-micro text-[var(--color-text-muted)] will-change-transform"
          >
            {resolvedCounter}
          </p>
        </div>

        <div className="mt-8 grid gap-10 sm:mt-10 md:grid-cols-[1.05fr_1fr] md:items-start md:gap-12 lg:gap-16">
          <div>
            <h2 className="anvl-heading font-normal leading-[0.88] text-[clamp(2rem,7vw,4.75rem)]">
              {heading.split(' ').map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="mr-2 inline-block overflow-hidden pb-[0.06em] align-baseline"
                >
                  <span
                    data-oath-word="true"
                    className="inline-block will-change-transform"
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h2>

            <span
              data-oath-rule="true"
              aria-hidden="true"
              className="mt-5 block h-px w-32 bg-[var(--color-accent)] will-change-transform"
            />

            <p
              data-oath-intro="true"
              className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] will-change-transform sm:text-[15px]"
            >
              {intro}
            </p>
          </div>

          <ol className="grid gap-2 sm:gap-3">
            {visibleTenets.map((tenet, index) => (
              <li
                key={tenet.id}
                data-oath-tenet="true"
                className="group flex items-center gap-4 border-b border-[var(--color-line)] py-3 will-change-transform sm:py-4"
              >
                <span className="anvl-heading w-10 shrink-0 text-xl font-normal leading-none text-[var(--color-accent)] sm:text-2xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="anvl-heading text-base font-normal leading-tight tracking-[0.04em] text-[var(--color-heading)] sm:text-lg md:text-xl">
                  {tenet.text}
                </p>
                <span
                  aria-hidden="true"
                  className="ml-auto text-[var(--color-text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
                >
                  →
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
