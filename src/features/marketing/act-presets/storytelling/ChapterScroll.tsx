import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { applyCalmIdleFloat, wordRevealTargets } from '../shared/actMotionHelpers'
import { formatTenetLine } from '../shared/actPresetUtils'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Default storytelling — chapter timeline with scroll-linked cards. */
export function ChapterScrollPreset({
  landing,
  row,
  emblemSrc,
}: ActPresetProps) {
  const m = previewManifestoFields(landing.manifesto, row, 'storytelling')
  const root = useRef<HTMLElement | null>(null)
  const chapters = m.intro.split(/\n\n+/).filter(Boolean)
  const visibleTenets = m.tenets.filter((t) => t.isVisible !== false)
  const blocks = chapters.length ? chapters : [m.intro]

  useActPresetMotion(root, row, {
    snapSelectors: ['[data-chapter-rail]', '[data-chapter-card]', '[data-chapter-emblem]'],
    onAnimate: (host, ctx) => {
      const tokens = ctx?.tokens
      const cards = gsap.utils.toArray<HTMLElement>('[data-chapter-card]', host)
      const rail = host.querySelector('[data-chapter-rail]')
      const emblem = host.querySelector('[data-chapter-emblem]')

      gsap.set(rail, { scaleY: 0, transformOrigin: 'top center' })
      gsap.set(emblem, { opacity: 0, y: tokens?.enterY ?? 28 })

      gsap.to(rail, {
        scaleY: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: host, start: 'top 75%', toggleActions: 'play none none reverse' },
      })

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, x: (tokens?.enterX ?? 24) * 0.8 },
          {
            opacity: 1,
            x: 0,
            duration: tokens?.duration ?? 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 84%',
              toggleActions: 'play none none reverse',
            },
            delay: i * 0.03,
          },
        )
        wordRevealTargets(card, '[data-chapter-word]', tokens ?? { duration: 0.85, stagger: 0.1, enterY: 36, enterX: 28, scrub: 0.6, parallaxY: 12 }, 'standard', 'top 88%')
      })

      gsap.to(emblem, {
        opacity: 0.35,
        y: 0,
        duration: tokens?.duration ?? 0.85,
        scrollTrigger: { trigger: host, start: 'top 70%', toggleActions: 'play none none reverse' },
      })

      return applyCalmIdleFloat(emblem, tokens ?? { duration: 0.85, stagger: 0.1, enterY: 36, enterX: 28, scrub: 0.6, parallaxY: 12 }, 'subtle')
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label="Story"
    >
      <ActMediaBackdrop row={row} />
      <div
        data-chapter-emblem
        aria-hidden
        className="pointer-events-none absolute right-0 top-16 hidden opacity-0 lg:block"
      >
        <DropEmblemDecor src={emblemSrc} className="h-64 w-auto opacity-30" alt="" />
      </div>
      <Container className="anvl-act-content relative z-10 grid gap-8 py-6 sm:gap-10 sm:py-8 lg:grid-cols-[3rem_1fr] lg:gap-12">
        <div aria-hidden className="relative hidden lg:block">
          <div
            data-chapter-rail
            className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--color-line)]"
          />
        </div>
        <div>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {m.actLabel} · {m.counterLabel}
          </p>
          <h2 className="anvl-display mb-10 text-[clamp(2rem,4.5vw,3.25rem)] leading-[0.94] text-[var(--color-heading)]">
            {m.heading.split(/\s+/).map((word, i) => (
              <span key={`${word}-${i}`} className="mr-[0.25em] inline-block">
                <span data-chapter-word className="inline-block">
                  {word}
                </span>
              </span>
            ))}
          </h2>
          <div className="space-y-6">
            {blocks.map((chapter, i) => (
              <article
                key={`chapter-${i}`}
                data-chapter-card
                className="rounded-xl border border-[var(--color-line)]/80 bg-[var(--color-surface)]/20 p-5 backdrop-blur-sm md:p-7"
              >
                <p className="anvl-micro mb-3 text-[10px] text-[var(--color-accent)]">
                  Chapter {String(i + 1).padStart(2, '0')}
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
                  {chapter}
                </p>
              </article>
            ))}
            {visibleTenets.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {visibleTenets.map((tenet) => (
                  <li
                    key={tenet.id}
                    className="rounded-lg border border-[var(--color-line)]/70 px-4 py-3 text-sm text-[var(--color-text)]"
                  >
                    {formatTenetLine(tenet as { label?: string; body?: string; text?: string })}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}
