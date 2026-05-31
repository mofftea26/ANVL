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
  applyCalmIdlePulse,
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

/** Centered emblem hero — atmospheric background, foreground focal emblem or product. */
export function MinimalEmblemHeroPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const hero = previewHeroFields(landing.hero, row)
  const root = useRef<HTMLElement | null>(null)
  const lines = hero.title.split(/\s+/).filter(Boolean)
  const showFallbackMark = !hasActForegroundMedia(row)
  const countdown = useLiveCountdown(hero.countdownTargetIso)
  const animation = resolveActAnimation(row)
  const tokens = getActMotionTokens(animation.intensity)

  useActPresetMotion(root, row, {
    snapSelectors: [
      '[data-minimal-emblem]',
      '[data-minimal-line]',
      '[data-minimal-sub]',
      '[data-minimal-ctas]',
      '[data-minimal-ring]',
      '[data-minimal-meta]',
      '[data-minimal-focal]',
    ],
    onAnimate: (host, ctx) => {
      const motionTokens = ctx?.tokens ?? tokens
      const motionAnim = resolveActAnimation(row)
      const emblem = host.querySelector('[data-minimal-emblem]')
      const ring = host.querySelector('[data-minimal-ring]')
      const focal = host.querySelector('[data-minimal-focal]')
      const sub = host.querySelector('[data-minimal-sub]')
      const ctas = host.querySelector('[data-minimal-ctas]')
      const linesEls = gsap.utils.toArray<HTMLElement>('[data-minimal-line]', host)

      if (showFallbackMark) {
        gsap.set(ring, { opacity: 0, scale: 0.8 })
        gsap.set(emblem, { opacity: 0, scale: 0.88 })
      } else if (focal) {
        gsap.set(focal, { opacity: 0, scale: 0.9, y: motionTokens.enterY * 0.35 })
      }
      gsap.set(linesEls, { opacity: 0, y: motionTokens.enterY * 0.7 })
      gsap.set([sub, ctas], { opacity: 0, y: motionTokens.enterY * 0.45 })

      const intro = gsap.timeline({
        scrollTrigger: {
          trigger: host,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
      })

      if (showFallbackMark) {
        intro
          .to(ring, { opacity: 1, scale: 1, duration: 1.1, ease: 'sine.out' }, 0)
          .to(
            emblem,
            {
              opacity: 1,
              scale: 1,
              duration: motionTokens.duration + 0.15,
              ease: scaleEase(motionAnim.intensity),
            },
            0.05,
          )
      } else if (focal) {
        intro.to(
          focal,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: motionTokens.duration + 0.1,
            ease: scaleEase(motionAnim.intensity),
          },
          0,
        )
      }

      intro
        .to(
          linesEls,
          {
            opacity: 1,
            y: 0,
            stagger: motionTokens.stagger,
            duration: motionTokens.duration,
            ease: 'power3.out',
          },
          showFallbackMark || focal ? 0.15 : 0,
        )
        .to(sub, { opacity: 1, y: 0, duration: motionTokens.duration * 0.75 }, 0.35)
        .to(ctas, { opacity: 1, y: 0, duration: motionTokens.duration * 0.75 }, 0.42)

      const floatTarget = showFallbackMark
        ? '[data-minimal-emblem]'
        : focal
          ? '[data-minimal-focal]'
          : undefined

      const typeCleanup = applyActMotionByType(host, motionAnim, motionTokens, {
        blocks: '[data-minimal-line]',
        words: '[data-minimal-line]',
        floatTarget,
        scrollStart: 'top 78%',
      })

      const idleTarget = showFallbackMark ? emblem : focal
      const idleCleanup =
        idleTarget && showFallbackMark
          ? applyCalmIdlePulse(idleTarget, motionAnim.intensity)
          : idleTarget
            ? applyCalmIdlePulse(idleTarget, motionAnim.intensity)
            : undefined

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
        overlayClassName="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/55 via-[var(--color-bg)]/70 to-[var(--color-bg)]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,color-mix(in_srgb,var(--color-hero-glow)_18%,transparent),transparent_70%)]"
      />

      <Container className="anvl-act-content relative z-10 flex flex-col items-center justify-center gap-4 px-4 py-6 text-center sm:gap-6 sm:py-8 md:gap-7">
        {hasActForegroundMedia(row) ? (
          <div
            data-minimal-focal
            className="relative mb-1 w-full max-w-xs overflow-visible sm:mb-2 sm:max-w-sm"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-full opacity-70"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 72%)',
              }}
            />
            <div className="relative aspect-square w-full overflow-hidden rounded-full border border-[var(--color-line)]/60 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.85)]">
              <ActVisualFrame
                row={row}
                layer="foreground"
                className="relative h-full w-full"
                mediaClassName="h-full w-full object-cover object-center"
                overlayClassName="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)]/40 via-transparent to-transparent"
              />
            </div>
          </div>
        ) : showFallbackMark ? (
          <div className="relative mx-auto">
            <div
              data-minimal-ring
              aria-hidden
              className="absolute inset-0 -m-5 rounded-full border border-[var(--color-line)]/80 sm:-m-8 md:-m-10"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 70%)',
              }}
            />
            <div data-minimal-emblem className="relative px-2">
              <DropEmblemDecor
                src={emblemSrc}
                className="mx-auto h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36"
                alt=""
              />
            </div>
          </div>
        ) : null}

        <Badge>{hero.badgeText}</Badge>

        {hero.countdownTargetIso ? (
          <div className="w-full max-w-sm space-y-2">
            <p className="anvl-micro text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Countdown
            </p>
            <CountdownTiles parts={countdown} className="grid grid-cols-4 gap-2" />
          </div>
        ) : null}

        <h1 className="anvl-display max-w-3xl px-1 text-[clamp(2rem,5.5vw,4.25rem)] leading-[0.94] text-[var(--color-heading)]">
          {lines.map((line, i) => (
            <span key={`${line}-${i}`} data-minimal-line className="block">
              {line}
            </span>
          ))}
        </h1>

        <p
          data-minimal-sub
          className="max-w-lg px-2 text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base"
        >
          {hero.subtitle}
        </p>

        <div data-minimal-ctas className="flex flex-wrap justify-center gap-3 px-2">
          <SafeLink data-act-micro href={hero.primaryCta.href} className="anvl-btn anvl-btn-primary">
            {hero.primaryCta.label}
          </SafeLink>
          <SafeLink data-act-micro href={hero.secondaryCta.href} className="anvl-btn anvl-btn-ghost">
            {hero.secondaryCta.label}
          </SafeLink>
        </div>

        <dl
          data-minimal-meta
          className="grid w-full max-w-md grid-cols-3 gap-3 border-t border-[var(--color-line)]/70 px-2 pt-5 sm:gap-4 sm:pt-6"
        >
          {hero.meta.map((item) => {
            const pulse = item.label.toLowerCase() === 'status'
            return (
              <div key={item.id}>
                <dt className="anvl-micro text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  {item.label}
                </dt>
                <dd className="anvl-heading mt-1 flex items-center justify-center gap-1.5 text-base font-normal sm:text-lg">
                  {pulse ? (
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
                  ) : null}
                  {item.value}
                </dd>
              </div>
            )
          })}
        </dl>
      </Container>
    </section>
  )
}
