import { useRef } from 'react'
import { previewHeroFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Badge } from '@/shared/components/ui/Badge'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { ActVisualFrame } from '../shared/ActVisualFrame'
import {
  applyActMotionByType,
  applyCalmIdleFloat,
} from '../shared/actMotionHelpers'
import {
  getActMotionTokens,
  resolveActAnimation,
  scaleEase,
} from '../shared/actAnimationConfig'
import { hasActForegroundMedia } from '../shared/actPresetUtils'
import { CountdownTiles, useLiveCountdown } from '../shared/LiveCountdown'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Cinematic split hero — full-bleed background, floating foreground product, editorial copy. */
export function SplitProductHeroPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const hero = previewHeroFields(landing.hero, row)
  const root = useRef<HTMLElement | null>(null)
  const titleWords = hero.title.split(/\s+/).filter(Boolean)
  const showFallbackMark = !hasActForegroundMedia(row)
  const countdown = useLiveCountdown(hero.countdownTargetIso)
  const animation = resolveActAnimation(row)
  const tokens = getActMotionTokens(animation.intensity)

  useActPresetMotion(root, row, {
    snapSelectors: [
      '[data-cine-hero-copy]',
      '[data-cine-hero-visual]',
      '[data-cine-hero-word]',
      '[data-cine-hero-product]',
      '[data-cine-hero-meta]',
      '[data-cine-hero-accent]',
    ],
    onAnimate: (host, ctx) => {
      const motionTokens = ctx?.tokens ?? tokens
      const motionAnim = resolveActAnimation(row)

      const copy = host.querySelector('[data-cine-hero-copy]')
      const visual = host.querySelector('[data-cine-hero-visual]')
      const product = host.querySelector('[data-cine-hero-product]')
      const accent = host.querySelector('[data-cine-hero-accent]')

      gsap.set(copy, { opacity: 0, x: -motionTokens.enterX })
      gsap.set(visual, { opacity: 0, x: motionTokens.enterX * 0.6 })
      gsap.set(product, { opacity: 0, y: motionTokens.enterY * 0.5, scale: 0.92 })
      gsap.set(accent, { scaleY: 0, transformOrigin: 'top center' })

      gsap
        .timeline({
          scrollTrigger: {
            trigger: host,
            start: 'top 72%',
            toggleActions: 'play none none reverse',
          },
        })
        .to(accent, { scaleY: 1, duration: 0.9, ease: 'power3.out' }, 0)
        .to(copy, { opacity: 1, x: 0, duration: motionTokens.duration, ease: 'power3.out' }, 0.08)
        .to(
          product,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: motionTokens.duration + 0.1,
            ease: scaleEase(motionAnim.intensity),
          },
          0.12,
        )
        .to(visual, { opacity: 1, x: 0, duration: motionTokens.duration, ease: 'power3.out' }, 0.15)

      const typeCleanup = applyActMotionByType(host, motionAnim, motionTokens, {
        blocks: '[data-cine-hero-copy]',
        words: '[data-cine-hero-word]',
        floatTarget: '[data-cine-hero-product]',
        scrollStart: 'top 70%',
      })

      const idleCleanup = applyCalmIdleFloat(product, motionTokens, motionAnim.intensity)

      return () => {
        typeCleanup?.()
        idleCleanup?.()
      }
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Hero"
    >
      <ActMediaBackdrop
        row={row}
        overlayClassName="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)] via-[var(--color-bg)]/75 to-[var(--color-bg)]/25"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 120% 80% at 78% 45%, color-mix(in srgb, var(--color-hero-glow) 28%, transparent), transparent 58%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_35%,color-mix(in_srgb,var(--color-bg)_55%,transparent)_100%)]"
      />

      <Container className="anvl-act-content relative z-10 grid items-center gap-6 py-6 sm:gap-8 md:gap-10 lg:grid-cols-12 lg:gap-6 lg:py-8">
        <div
          data-cine-hero-copy
          className="relative flex flex-col gap-5 md:gap-6 lg:col-span-5 lg:py-8"
        >
          <div
            data-cine-hero-accent
            aria-hidden
            className="absolute -left-3 top-0 hidden h-full w-px origin-top bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-line)] to-transparent lg:block"
          />

          <Badge>{hero.badgeText}</Badge>

          {hero.countdownTargetIso ? (
            <div className="space-y-2">
              <p className="anvl-micro text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Countdown
              </p>
              <CountdownTiles parts={countdown} className="grid max-w-xs grid-cols-4 gap-1.5" />
            </div>
          ) : null}

          <h1 className="anvl-display text-[clamp(2.5rem,7.5vw,5.5rem)] leading-[0.88] tracking-[-0.02em] text-[var(--color-heading)]">
            {titleWords.map((word, i) => (
              <span key={`${word}-${i}`} className="mr-[0.2em] inline-block overflow-hidden">
                <span data-cine-hero-word className="inline-block">
                  {word}
                </span>
              </span>
            ))}
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
            {hero.subtitle}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <SafeLink data-act-micro href={hero.primaryCta.href} className="anvl-btn anvl-btn-primary">
              {hero.primaryCta.label}
            </SafeLink>
            <SafeLink data-act-micro href={hero.secondaryCta.href} className="anvl-btn anvl-btn-ghost">
              {hero.secondaryCta.label}
            </SafeLink>
          </div>

          <dl
            data-cine-hero-meta
            className="grid max-w-md gap-4 border-t border-[var(--color-line)]/70 pt-5 sm:grid-cols-3"
          >
            {hero.meta.map((item) => {
              const pulse = item.label.toLowerCase() === 'status'
              return (
                <div key={item.id}>
                  <dt className="anvl-micro text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    {item.label}
                  </dt>
                  <dd className="anvl-heading mt-1 flex items-center gap-2 text-lg font-normal text-[var(--color-heading)]">
                    {pulse ? (
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
                    ) : null}
                    {item.value}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>

        <div
          data-cine-hero-visual
          className="relative flex min-h-[min(58vh,32rem)] items-center justify-center lg:col-span-7 lg:col-start-6 lg:min-h-[min(72vh,40rem)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[8%] rounded-[2rem] border border-[var(--color-line)]/35"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 60%)',
            }}
          />

          <div
            data-cine-hero-product
            className="relative z-10 w-full max-w-xl lg:max-w-2xl"
          >
            {hasActForegroundMedia(row) ? (
              <ActVisualFrame
                row={row}
                layer="foreground"
                className="relative aspect-[4/5] w-full"
                mediaClassName="h-full w-full object-contain object-center drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)]"
                overlayClassName=""
              />
            ) : showFallbackMark ? (
              <div className="relative flex aspect-[4/5] items-center justify-center">
                <div
                  aria-hidden
                  className="absolute inset-[12%] rounded-full opacity-80"
                  style={{
                    background:
                      'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 72%)',
                  }}
                />
                <DropEmblemDecor
                  src={emblemSrc}
                  className="relative z-10 max-h-[min(48vh,22rem)] w-auto opacity-95"
                  alt=""
                />
              </div>
            ) : null}
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-6 left-1/2 h-px w-[min(72%,28rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--color-accent)]/50 to-transparent"
          />
        </div>
      </Container>
    </section>
  )
}
