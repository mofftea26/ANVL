import { useRef } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { AnvlCrest } from '@/shared/assets/brand'
import { formatChapterNumber, type StoryChapter } from '@/features/story/schemas/story.schema'
import { StoryMedia } from '@/features/story/components/StoryMedia'
import { CastRoster } from '@/features/story/components/CastRoster'
import { chapterCastMembers } from '@/features/story/lib/chapterPages'
import type { BookSpread } from '@/features/story/lib/bookSpreads'

type Spread = Extract<BookSpread, { kind: 'spread' }>

interface PageProps {
  spread: Spread
  chapter: StoryChapter
  pageNo: number
  total: number
  foil: string
  /** Disable the GSAP reveal (lightweight flat/mobile reader). */
  animate?: boolean
}

/** A random "from" pose for media so the reveal differs every page. */
const MEDIA_ANIMS: gsap.TweenVars[] = [
  { scale: 1.16, opacity: 0, filter: 'blur(10px)' },
  { xPercent: 26, opacity: 0, rotation: 2, filter: 'blur(6px)' },
  { yPercent: 22, opacity: 0, scale: 0.94 },
  { scale: 0.84, opacity: 0, rotation: -2.5, filter: 'blur(8px)' },
  { opacity: 0, filter: 'blur(14px)', scale: 1.1 },
  { xPercent: -24, opacity: 0, rotation: -1.5, filter: 'blur(6px)' },
]

/** Split a paragraph into animatable word spans. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/\s+/).map((w, i) => (
        <span key={i} data-word className="mr-[0.28em] inline-block">
          {w}
        </span>
      ))}
    </>
  )
}

/** Running header pinned to the top of the page. */
function PageHeader({ left, right }: { left: string; right: string }) {
  return (
    <header
      data-head
      className="absolute inset-x-[34px] top-[18px] flex items-baseline justify-between gap-3 border-b border-[var(--color-line)] pb-2"
    >
      <span className="anvl-display truncate text-[10px] tracking-[0.26em] text-[var(--color-text-muted)]">
        {left}
      </span>
      <span className="anvl-display shrink-0 text-[10px] tracking-[0.26em] text-[var(--color-heading)]">
        {right}
      </span>
    </header>
  )
}

/** Folio (page number) pinned to the bottom — outer edge, like a printed book. */
function PageFooter({ pageNo, total, side }: { pageNo: number; total: number; side: 'left' | 'right' }) {
  return (
    <footer
      data-foot
      className={`absolute inset-x-[34px] bottom-[16px] flex items-center gap-2 border-t border-[var(--color-line)] pt-2 text-[10px] tracking-[0.2em] text-[var(--color-text-muted)] ${
        side === 'left' ? 'justify-start' : 'justify-end'
      }`}
    >
      {side === 'right' ? <span className="h-px w-3 bg-[var(--color-line)]" /> : null}
      {pageNo} / {total}
      {side === 'left' ? <span className="h-px w-3 bg-[var(--color-line)]" /> : null}
    </footer>
  )
}

/**
 * Right (recto) page — the act's text. Header pinned top, folio pinned bottom,
 * body strictly bounded between them. On mount (after the leaf settles) the
 * content reveals magically: title blurs in, the rule draws, words rise one by
 * one out of the parchment.
 */
export function BookRightPage({ spread, chapter, pageNo, total, animate = true }: PageProps) {
  const scope = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced || !animate) return
      // Tween only selectors present on this page variant (no GSAP warnings).
      const has = (sel: string) => Boolean(scope.current?.querySelector(sel))
      gsap.from('[data-head]', { opacity: 0, y: -8, duration: 0.5, ease: 'power2.out' })
      gsap.from('[data-title]', {
        opacity: 0,
        y: 14,
        filter: 'blur(8px)',
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.05,
      })
      gsap.from('[data-rule]', { scaleX: 0, transformOrigin: 'left center', duration: 0.7, ease: 'power3.inOut', delay: 0.2 })
      if (has('[data-word]')) {
        gsap.from('[data-word]', {
          opacity: 0,
          yPercent: 70,
          filter: 'blur(6px)',
          duration: 0.55,
          ease: 'power2.out',
          stagger: 0.011,
          delay: 0.18,
        })
      }
      gsap.from('[data-foot]', { opacity: 0, duration: 0.6, delay: 0.35 })
    },
    { scope },
  )

  return (
    <article ref={scope} className="relative h-full w-full overflow-hidden">
      <PageHeader
        left={spread.chapterTitle}
        right={spread.roster ? 'The Army' : `Act ${formatChapterNumber(spread.actNumber)}`}
      />

      <div className="absolute inset-x-[34px] bottom-[52px] top-[54px] overflow-hidden">
        {spread.roster ? <RosterBody chapter={chapter} /> : <ActBody spread={spread} />}
      </div>

      <PageFooter pageNo={pageNo} total={total} side="right" />
    </article>
  )
}

function ActBody({ spread }: { spread: Spread }) {
  return (
    <div className="space-y-3.5">
      {spread.part === 1 ? (
        <header data-title className="mb-1">
          <p className="anvl-display text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
            Act {formatChapterNumber(spread.actNumber)}
          </p>
          <h3 className="anvl-heading mt-1 text-[1.7rem] font-normal leading-[0.98] text-[var(--color-heading)]">
            {spread.actTitle}
          </h3>
        </header>
      ) : (
        <p data-title className="anvl-display text-[10px] tracking-[0.26em] text-[var(--color-text-muted)]">
          {spread.actTitle} — continued
        </p>
      )}
      <span data-rule className="block h-px w-12 bg-[var(--color-text-muted)] opacity-40" />

      {spread.paras.map((text, i) => (
        <p key={i} className="text-[14px] leading-[1.62] text-[var(--color-text-muted)]">
          <Words text={text} />
        </p>
      ))}
    </div>
  )
}

function RosterBody({ chapter }: { chapter: StoryChapter }) {
  const cast = chapterCastMembers(chapter)
  return (
    <div data-title>
      <h3 className="anvl-heading text-[1.7rem] font-normal leading-[0.98] text-[var(--color-heading)]">
        The Army
      </h3>
      <span data-rule className="mt-2 block h-px w-12 bg-[var(--color-text-muted)] opacity-40" />
      <div className="mt-3 text-[12px]">
        <CastRoster cast={cast} title="Those written into this chapter" />
      </div>
    </div>
  )
}

/**
 * Left (verso) page — always visual: the act's asset as a framed plate, or an
 * illuminated emblem (crest, numeral, chapter + act titles). Carries its own
 * running header and folio. Media gets a different magical reveal every turn.
 */
export function BookLeftPage({ spread, pageNo, total, foil, animate = true }: Omit<PageProps, 'chapter'>) {
  const scope = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced || !animate) return
      // Tween only selectors present on this page variant (no GSAP warnings).
      const has = (sel: string) => Boolean(scope.current?.querySelector(sel))
      gsap.from('[data-head]', { opacity: 0, y: -8, duration: 0.5, ease: 'power2.out' })
      if (has('[data-media]')) {
        const pose = MEDIA_ANIMS[Math.floor(Math.random() * MEDIA_ANIMS.length)]
        gsap.from('[data-media]', { ...pose, duration: 0.9, ease: 'power3.out', delay: 0.08 })
        gsap.fromTo(
          '[data-sheen]',
          { xPercent: -140 },
          { xPercent: 140, duration: 1.1, ease: 'power2.inOut', delay: 0.25 },
        )
      }
      if (has('[data-crest]')) {
        gsap.from('[data-crest]', {
          opacity: 0,
          scale: 0.6,
          rotation: -8,
          filter: 'blur(6px)',
          duration: 0.9,
          ease: 'power3.out',
        })
        gsap.from('[data-numeral]', {
          opacity: 0,
          y: 26,
          filter: 'blur(10px)',
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.12,
        })
        gsap.from('[data-rule]', { scaleX: 0, duration: 0.8, ease: 'power3.inOut', delay: 0.3 })
      }
      gsap.from('[data-caption]', { opacity: 0, y: 12, duration: 0.7, ease: 'power2.out', delay: 0.28 })
      gsap.from('[data-foot]', { opacity: 0, duration: 0.6, delay: 0.35 })
    },
    { scope },
  )

  const isMedia = spread.left.type === 'media'

  return (
    <article ref={scope} className="relative h-full w-full overflow-hidden">
      <PageHeader left={spread.dropLabel} right={spread.chapterTitle} />

      {isMedia && spread.left.type === 'media' ? (
        <>
          <figure
            data-media
            className="absolute inset-x-[34px] bottom-[108px] top-[54px] overflow-hidden rounded-sm border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-bg)_60%,#000)]"
          >
            <StoryMedia asset={spread.left.asset} className="absolute inset-0" />
            <span
              data-sheen
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-full"
              style={{
                background:
                  'linear-gradient(105deg, transparent 38%, rgba(255,248,228,0.22) 50%, transparent 62%)',
              }}
            />
          </figure>
          <figcaption
            data-caption
            className="absolute inset-x-[34px] bottom-[52px] flex h-[48px] flex-col items-center justify-center text-center"
          >
            <p className="anvl-display text-[9px] tracking-[0.32em]" style={{ color: foil }}>
              Act {formatChapterNumber(spread.actNumber)}
            </p>
            <p className="anvl-heading mt-0.5 truncate text-[15px] font-normal leading-tight text-[var(--color-heading)]">
              {spread.actTitle}
            </p>
          </figcaption>
        </>
      ) : (
        <div className="absolute inset-x-[34px] bottom-[52px] top-[54px] flex flex-col items-center justify-center gap-4 text-center">
          <span data-crest style={{ color: foil }}>
            <AnvlCrest className="h-14 w-14" />
          </span>
          <p
            data-numeral
            className="anvl-heading text-[5.2rem] font-normal leading-none"
            style={{ color: foil }}
          >
            {spread.roster ? '✶' : formatChapterNumber(spread.actNumber)}
          </p>
          <span data-rule className="block h-px w-16" style={{ background: foil }} />
          <div data-caption>
            <h2 className="anvl-heading text-xl font-normal leading-tight text-[var(--color-heading)]">
              {spread.chapterTitle}
            </h2>
            <p className="anvl-display mt-2 text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
              {spread.roster ? 'The Army' : spread.actTitle}
              {spread.partCount > 1 ? ` · ${spread.part}/${spread.partCount}` : ''}
            </p>
          </div>
        </div>
      )}

      <PageFooter pageNo={pageNo} total={total} side="left" />
    </article>
  )
}
