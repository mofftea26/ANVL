import { useEffect, useState } from 'react'
import { useRef } from 'react'
import type { ActAnimationIntensity } from '@/features/cms/landing/landingActs.types'
import type { CmsMetaItem } from '@/features/cms/landing/landingPageCms.types'
import type { ActMotionType } from '@/features/marketing/act-presets/shared/actAnimationConfig'
import { getActMotionTokens } from '@/features/marketing/act-presets/shared/actAnimationConfig'
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
  /** Fallback campaign mark — omit when act media is present. */
  emblemSrc?: string
  countdownTargetIso?: string
  motionType?: ActMotionType
  motionEnabled?: boolean
  motionIntensity?: ActAnimationIntensity
}

const EMBER_COUNT = 10

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
  countdownTargetIso,
  motionType = 'wordReveal',
  motionEnabled = true,
  motionIntensity = 'standard',
}: HeroForgeSequenceProps) {
  const metaItems = meta.length > 0 ? meta : DEFAULT_META
  const root = useRef<HTMLElement | null>(null)
  const showCrest = Boolean(emblemSrc?.trim())
  const runMotion = motionEnabled && motionType !== 'none'
  const tokens = getActMotionTokens(motionIntensity)

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
        const metaEl = host.querySelector('[data-hero-meta]')
        const crest = host.querySelector('[data-hero-crest]')
        const glow = host.querySelector('[data-hero-glow]')
        const vignette = host.querySelector('[data-hero-vignette]')
        const embers = gsap.utils.toArray<HTMLElement>('[data-hero-ember]', host)
        return {
          words,
          badge,
          subtitleEl,
          ctaEl,
          meta: metaEl,
          crest,
          glow,
          vignette,
          embers,
        }
      }

      const snapFinal = () => {
        const { words, badge, subtitleEl, ctaEl, meta: metaEl, crest } = queryElements()
        gsap.set([badge, subtitleEl, ctaEl, metaEl, crest, ...words], {
          opacity: 1,
          y: 0,
          yPercent: 0,
          scale: 1,
        })
      }

      mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', snapFinal)

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        if (!runMotion) {
          snapFinal()
          return
        }

        const {
          words,
          badge,
          subtitleEl,
          ctaEl,
          meta: metaEl,
          crest,
          glow,
          vignette,
          embers,
        } = queryElements()

        const wordStagger = motionType === 'stagger' ? tokens.stagger * 1.35 : 0.1
        const useWordReveal =
          motionType === 'wordReveal' || motionType === 'stagger'
        const useFadeUp = motionType === 'fadeUp'
        const emphasizeParallax = motionType === 'parallax'
        const emphasizeIdle = motionType === 'calmIdle'

        if (useWordReveal) {
          gsap.set(words, { yPercent: 115, opacity: 0 })
        } else if (useFadeUp) {
          gsap.set(words, { y: tokens.enterY, opacity: 0 })
        } else {
          gsap.set(words, { opacity: 0, y: tokens.enterY * 0.5 })
        }

        gsap.set([badge, subtitleEl, ctaEl, metaEl], { opacity: 0, y: 22 })
        if (crest) {
          gsap.set(crest, {
            opacity: 0,
            scale: 0.7,
            rotateY: -18,
            rotateX: 8,
            transformPerspective: 1100,
            transformOrigin: '50% 50%',
          })
        }
        if (glow) gsap.set(glow, { opacity: 0, scale: 0.6 })
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

        if (glow) intro.to(glow, { opacity: 1, scale: 1, duration: 1.5 }, 0)
        if (crest) {
          intro.to(
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
        }
        intro.to(
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
        intro.to(badge, { opacity: 1, y: 0, duration: 0.8 }, 0.15)

        if (useWordReveal) {
          intro.to(
            words,
            {
              yPercent: 0,
              opacity: 1,
              duration: tokens.duration + 0.15,
              stagger: wordStagger,
              ease: 'expo.out',
            },
            0.25,
          )
        } else {
          intro.to(
            words,
            {
              y: 0,
              opacity: 1,
              duration: tokens.duration,
              stagger: tokens.stagger,
              ease: 'power3.out',
            },
            0.25,
          )
        }

        intro
          .to(subtitleEl, { opacity: 1, y: 0, duration: 0.7 }, 0.6)
          .to(ctaEl, { opacity: 1, y: 0, duration: 0.7 }, 0.75)
          .to(metaEl, { opacity: 1, y: 0, duration: 0.7 }, 0.85)

        if (crest && (emphasizeIdle || motionType === 'wordReveal')) {
          gsap.to(crest, {
            rotateY: 5,
            rotateX: -2,
            duration: 7,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1.5,
          })
        }

        if (glow) {
          gsap.to(glow, {
            opacity: 0.7,
            scale: 1.06,
            duration: 3.6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1.4,
          })
        }

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

        if (emphasizeParallax || motionType === 'wordReveal' || motionType === 'fadeUp') {
          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: host,
              start: 'top top+=64',
              end: 'bottom top',
              scrub: tokens.scrub,
            },
          })
          if (crest) scrollTl.to(crest, { yPercent: -6, scale: 1.85, opacity: 0.4 }, 0)
          scrollTl
            .to(words, { yPercent: emphasizeParallax ? -36 : -28, stagger: 0.03 }, 0)
            .to([badge, subtitleEl, ctaEl, metaEl], { opacity: 0, y: -18 }, 0)
            .to(vignette, { opacity: 1 }, 0)
        }
      })

      return () => mm.revert()
    },
    {
      scope: root,
      dependencies: [runMotion, motionType, motionIntensity, showCrest],
    },
  )

  return (
    <section
      ref={root}
      className="anvl-screen-section-fixed relative w-full overflow-hidden border-b border-[var(--color-line)]"
      aria-label="ANVL Athletics hero"
    >
      <GrainOverlay />

      <div
        data-hero-glow="true"
        aria-hidden="true"
        className="pointer-events-none absolute right-[-22%] top-1/2 z-0 h-[150%] w-[130%] -translate-y-1/2 will-change-transform sm:right-[-18%] md:right-[-10%] lg:right-[-6%] lg:w-[110%]"
        style={{
          background:
            'radial-gradient(closest-side, var(--color-hero-glow), transparent 70%)',
        }}
      />

      {showCrest ? (
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
      ) : null}

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

      <div
        data-hero-vignette="true"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] opacity-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 110%, rgba(0,0,0,0.7), transparent 60%)',
        }}
      />

      <Container className="anvl-act-content relative z-10 flex h-full flex-col justify-center py-6 sm:py-8">
        <div className="grid w-full grid-cols-12 items-center">
          <div className="col-span-12 lg:col-span-8 xl:col-span-7">
            <div data-hero-badge="true">
              <Badge>{badgeText}</Badge>
            </div>

            {countdownTargetIso ? (
              <p
                data-hero-countdown="true"
                className="anvl-micro mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]"
              >
                <HeroCountdown targetIso={countdownTargetIso} />
              </p>
            ) : null}

            <h1
              data-hero-title="true"
              className="anvl-heading mt-3 font-normal leading-[0.86] tracking-[-0.01em] text-[clamp(2.25rem,9vw,6.5rem)] sm:mt-4"
            >
              {title.split(' ').map((word, i) => (
                <span key={`${word}-${i}`} className="block overflow-hidden pb-[0.06em]">
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

function HeroCountdown({ targetIso }: { targetIso: string }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const tick = () => {
      const target = new Date(targetIso).getTime()
      if (!Number.isFinite(target)) {
        setLabel('')
        return
      }
      const diff = target - Date.now()
      if (diff <= 0) {
        setLabel('Live now')
        return
      }
      const days = Math.floor(diff / 86_400_000)
      const hours = Math.floor((diff % 86_400_000) / 3_600_000)
      const mins = Math.floor((diff % 3_600_000) / 60_000)
      setLabel(
        days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m`,
      )
    }
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [targetIso])

  if (!label) return null
  return <>Opens in {label}</>
}
