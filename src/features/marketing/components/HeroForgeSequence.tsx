import { useRef } from 'react'
import type { CmsMetaItem } from '@/features/cms/landing/landingPageCms.types'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Badge } from '@/shared/components/ui/Badge'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { gsap, useGSAP } from '@/shared/lib/gsap'

interface HeroForgeSequenceProps {
  badgeText: string
  title: string
  subtitle: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
  meta?: CmsMetaItem[]
  emblemSrc?: string
}

const EMBER_COUNT = 10

/**
 * Act I — Forged Under Pressure.
 *
 * Compact, full-screen hero sized at `100svh - var(--anvl-header-h)`.
 * Type, copy, CTAs and the meta strip are tuned to fit that height
 * on every breakpoint (320px → 1920px), so the section never spills
 * into the next one. Animations stay in-section: an intro timeline
 * + idle loops, and a small scroll-linked parallax/fade as the user
 * leaves the section.
 */
const DEFAULT_META: CmsMetaItem[] = [
  { id: 'hero-meta-drop', label: 'Drop', value: '01' },
  { id: 'hero-meta-pieces', label: 'Pieces', value: '03' },
  { id: 'hero-meta-status', label: 'Status', value: 'Soon' },
]

export function HeroForgeSequence({
  badgeText,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  meta = DEFAULT_META,
  emblemSrc,
}: HeroForgeSequenceProps) {
  const metaItems = meta.length > 0 ? meta : DEFAULT_META
  const root = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const host = root.current
      if (!host) return

      const mm = gsap.matchMedia()

      const queryElements = () => {
        const words = gsap.utils.toArray<HTMLElement>('[data-hero-word]', host)
        const badge = host.querySelector('[data-hero-badge]')
        const subtitleEl = host.querySelector('[data-hero-sub]')
        const ctaEl = host.querySelector('[data-hero-ctas]')
        const meta = host.querySelector('[data-hero-meta]')
        const crest = host.querySelector('[data-hero-crest]')
        const glow = host.querySelector('[data-hero-glow]')
        const vignette = host.querySelector('[data-hero-vignette]')
        const embers = gsap.utils.toArray<HTMLElement>(
          '[data-hero-ember]',
          host,
        )
        return {
          words,
          badge,
          subtitleEl,
          ctaEl,
          meta,
          crest,
          glow,
          vignette,
          embers,
        }
      }

      mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
        const { words, badge, subtitleEl, ctaEl, meta, crest } =
          queryElements()
        gsap.set([badge, subtitleEl, ctaEl, meta, crest, ...words], {
          opacity: 1,
          y: 0,
          scale: 1,
        })
      })

      mm.add(
        '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        () => {
          const {
            words,
            badge,
            subtitleEl,
            ctaEl,
            meta,
            crest,
            glow,
            vignette,
            embers,
          } = queryElements()

          gsap.set(words, { yPercent: 115, opacity: 0 })
          gsap.set([badge, subtitleEl, ctaEl, meta], { opacity: 0, y: 22 })
          gsap.set(crest, {
            opacity: 0,
            scale: 0.7,
            rotateY: -18,
            rotateX: 8,
            transformPerspective: 1100,
            transformOrigin: '50% 50%',
          })
          gsap.set(glow, { opacity: 0, scale: 0.6 })
          gsap.set(embers, {
            opacity: 0,
            y: () => gsap.utils.random(40, 100),
            x: () => gsap.utils.random(-20, 20),
            scale: () => gsap.utils.random(0.5, 1.0),
          })

          const intro = gsap.timeline({
            defaults: { ease: 'expo.out' },
            delay: 0.1,
          })

          intro
            .to(glow, { opacity: 1, scale: 1, duration: 1.5 }, 0)
            .to(
              crest,
              {
                opacity: 1,
                scale: 1,
                rotateY: 0,
                rotateX: 0,
                duration: 1.7,
              },
              0,
            )
            .to(
              embers,
              {
                opacity: 0.55,
                y: 0,
                x: 0,
                scale: 1,
                duration: 1.2,
                stagger: { each: 0.05, from: 'random' },
                ease: 'power3.out',
              },
              0.1,
            )
            .to(badge, { opacity: 1, y: 0, duration: 0.8 }, 0.15)
            .to(
              words,
              {
                yPercent: 0,
                opacity: 1,
                duration: 1.0,
                stagger: 0.1,
                ease: 'expo.out',
              },
              0.25,
            )
            .to(subtitleEl, { opacity: 1, y: 0, duration: 0.7 }, 0.6)
            .to(ctaEl, { opacity: 1, y: 0, duration: 0.7 }, 0.75)
            .to(meta, { opacity: 1, y: 0, duration: 0.7 }, 0.85)

          gsap.to(crest, {
            rotateY: 5,
            rotateX: -2,
            duration: 7,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1.5,
          })

          gsap.to(glow, {
            opacity: 0.7,
            scale: 1.06,
            duration: 3.6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1.4,
          })

          embers.forEach((em, i) => {
            gsap.to(em, {
              y: '-=' + gsap.utils.random(40, 100),
              x: '+=' + gsap.utils.random(-20, 20),
              opacity: 0.15,
              duration: gsap.utils.random(4, 7),
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: 1.2 + i * 0.06,
            })
          })

          gsap
            .timeline({
              scrollTrigger: {
                trigger: host,
                start: 'top top+=64',
                end: 'bottom top',
                scrub: 0.6,
              },
            })
            .to(crest, { yPercent: -6, scale: 1.85, opacity: 0.4 }, 0)
            .to(words, { yPercent: -28, stagger: 0.03 }, 0)
            .to([badge, subtitleEl, ctaEl, meta], { opacity: 0, y: -18 }, 0)
            .to(vignette, { opacity: 1 }, 0)
        },
        host,
      )

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      className="anvl-screen-section-fixed relative w-full overflow-hidden border-b border-[var(--color-line)]"
      aria-label="ANVL Athletics hero"
    >
      <GrainOverlay />

      {/* Forge glow */}
      <div
        data-hero-glow="true"
        aria-hidden="true"
        className="pointer-events-none absolute right-[-22%] top-1/2 z-0 h-[150%] w-[130%] -translate-y-1/2 will-change-transform sm:right-[-18%] md:right-[-10%] lg:right-[-6%] lg:w-[110%]"
        style={{
          background:
            'radial-gradient(closest-side, var(--color-hero-glow), transparent 70%)',
        }}
      />

      {/* The Oath — hero centerpiece. Scales up on scroll-out. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-22%] top-1/2 z-0 -translate-y-1/2 select-none text-[var(--color-heading)] opacity-[0.18] sm:right-[-14%] sm:opacity-[0.22] md:right-[-6%] md:opacity-[0.28] lg:right-[-2%] lg:opacity-[0.5]"
      >
        <span data-hero-crest="true" className="block will-change-transform">
          <DropEmblemDecor
            src={emblemSrc}
            presentationOnly
            className="h-[62svh] w-auto sm:h-[68svh] md:h-[74svh] lg:h-[80svh]"
          />
        </span>
      </div>

      {/* Ember field */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      >
        {Array.from({ length: EMBER_COUNT }).map((_, i) => {
          const left = `${(i * 73) % 100}%`
          const top = `${(i * 41 + 18) % 100}%`
          const size = 2 + (i % 3)
          return (
            <span
              key={i}
              data-hero-ember="true"
              className="absolute rounded-full bg-[var(--color-accent)] mix-blend-screen will-change-transform"
              style={{
                left,
                top,
                width: `${size}px`,
                height: `${size}px`,
                boxShadow:
                  '0 0 10px var(--color-accent), 0 0 20px rgba(199,194,184,0.35)',
              }}
            />
          )
        })}
      </div>

      {/* Outro vignette */}
      <div
        data-hero-vignette="true"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] opacity-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 110%, rgba(0,0,0,0.7), transparent 60%)',
        }}
      />

      <Container className="relative z-10 flex h-full flex-col justify-center py-6 sm:py-8">
        <div className="grid w-full grid-cols-12 items-center">
          <div className="col-span-12 lg:col-span-8 xl:col-span-7">
            <div data-hero-badge="true">
              <Badge>{badgeText}</Badge>
            </div>

            <h1
              data-hero-title="true"
              className="anvl-heading mt-3 font-normal leading-[0.86] tracking-[-0.01em] text-[clamp(2.25rem,9vw,6.5rem)] sm:mt-4"
            >
              {title.split(' ').map((word) => (
                <span key={word} className="block overflow-hidden pb-[0.06em]">
                  <span
                    data-hero-word="true"
                    className="inline-block will-change-transform"
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            <p
              data-hero-sub="true"
              className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:mt-5 sm:text-[15px] md:text-base"
            >
              {subtitle}
            </p>

            <div
              data-hero-ctas="true"
              className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6"
            >
              <SafeLink
                href={primaryCta.href}
                className="focus-ring group relative inline-flex h-11 items-center overflow-hidden rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-bg)] no-underline"
              >
                <span className="relative z-10">{primaryCta.label}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transition-transform duration-500 group-hover:translate-x-full"
                />
              </SafeLink>
              <SafeLink
                href={secondaryCta.href}
                className="focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]/70 px-5 text-sm font-semibold no-underline backdrop-blur"
              >
                {secondaryCta.label}
              </SafeLink>
            </div>

            <dl
              data-hero-meta="true"
              className="mt-6 grid max-w-md gap-3 border-t border-[var(--color-line)] pt-4 sm:mt-8 sm:gap-5 sm:pt-5"
              style={{
                gridTemplateColumns: `repeat(${Math.max(metaItems.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              {metaItems.map((item) => {
                const hasPulse = item.label.toLowerCase() === 'status'
                return (
                  <div key={item.id}>
                    <dt className="anvl-micro text-[var(--color-text-muted)]">
                      {item.label}
                    </dt>
                    <dd className="anvl-heading mt-1 flex items-center gap-2 text-xl font-normal">
                      {hasPulse ? (
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
                      ) : null}
                      {item.value}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  )
}
