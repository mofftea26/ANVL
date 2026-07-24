import type { CSSProperties } from 'react'
import { AnvlCrest } from '@/shared/assets/brand'
import { formatChapterNumber, type StoryChapter } from '@/features/story/schemas/story.schema'
import { StoryMedia } from '@/features/story/components/StoryMedia'
import { CastRoster } from '@/features/story/components/CastRoster'
import { CastText } from '@/features/story/components/CastMention'
import { chapterCastMembers } from '@/features/story/lib/chapterPages'
import { spreadPageNumbers, type BookSpread } from '@/features/story/lib/bookSpreads'
import { resolveBookCover } from '@/features/story/components/book3d/bookConfig'

interface ChapterBookFlatProps {
  chapter: StoryChapter
  spreads: BookSpread[]
  current: number
}

/**
 * Flat reader — mobile / reduced-motion / no-WebGL. One spread renders as a
 * single scrollable parchment page (asset plate on top, act text below) with a
 * pinned running header and folio. Deliberately light: no three.js, no GSAP —
 * just a CSS enter animation (clamped by the global reduced-motion rule).
 */
export function ChapterBookFlat({ chapter, spreads, current }: ChapterBookFlatProps) {
  const spread = spreads[current] ?? spreads[0]
  const cover = resolveBookCover(chapter)
  const numbers = spreadPageNumbers(spreads, current)

  const pageStyle = {
    ['--color-heading']: cover.colors.heading,
    ['--color-text']: cover.colors.text,
    ['--color-text-muted']: cover.colors.text,
  } as CSSProperties

  return (
    <div
      className="relative flex h-[min(78svh,50rem)] w-[min(94vw,34rem)] flex-col overflow-hidden rounded-[14px] border border-[var(--color-line)] p-2 shadow-[10px_14px_50px_-12px_rgba(0,0,0,0.85)] sm:p-2.5"
      style={{ background: `linear-gradient(135deg, ${cover.colors.cover} 0%, #0e0d0c 70%)` }}
    >
      {spread?.kind === 'cover' || !spread ? (
        <FlatCover chapter={chapter} />
      ) : (
        <div
          key={spread.key}
          className="story-book-page story-page-enter flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border bg-[var(--color-surface)]"
          style={{ ...pageStyle, borderColor: 'var(--color-line)' }}
        >
          <header className="flex flex-none items-baseline justify-between gap-3 border-b border-[var(--color-line)] px-5 py-2.5">
            <span className="anvl-display truncate text-[10px] tracking-[0.26em] text-[var(--color-text-muted)]">
              {spread.chapterTitle}
            </span>
            <span className="anvl-display shrink-0 text-[10px] tracking-[0.26em] text-[var(--color-heading)]">
              {spread.roster ? 'The Army' : `Act ${formatChapterNumber(spread.actNumber)}`}
            </span>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {spread.left.type === 'media' ? (
              <figure className="relative mb-4 aspect-[16/10] overflow-hidden rounded-sm border border-[var(--color-line)]">
                <StoryMedia asset={spread.left.asset} className="absolute inset-0" />
              </figure>
            ) : null}

            {spread.roster ? (
              <RosterBody chapter={chapter} />
            ) : (
              <>
                {spread.part === 1 ? (
                  <header className="mb-3">
                    <p className="anvl-display text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
                      Act {formatChapterNumber(spread.actNumber)}
                    </p>
                    <h3 className="anvl-heading mt-1 text-2xl font-normal leading-[0.98] text-[var(--color-heading)]">
                      {spread.actTitle}
                    </h3>
                    <span className="mt-2 block h-px w-12 bg-[var(--color-text-muted)] opacity-40" />
                  </header>
                ) : (
                  <p className="anvl-display mb-3 text-[10px] tracking-[0.26em] text-[var(--color-text-muted)]">
                    {spread.actTitle} — continued
                  </p>
                )}
                <div className="space-y-3.5">
                  {spread.paras.map((text, i) => (
                    <p key={i} className="text-[15px] leading-[1.65] text-[var(--color-text-muted)]">
                      <CastText text={text} cast={chapter.cast} />
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>

          <footer className="flex flex-none items-center justify-center gap-2 border-t border-[var(--color-line)] px-5 py-2 text-[10px] tracking-[0.2em] text-[var(--color-text-muted)]">
            <span className="h-px w-3 bg-[var(--color-line)]" />
            {numbers.left}–{numbers.right} / {numbers.total}
            <span className="h-px w-3 bg-[var(--color-line)]" />
          </footer>
        </div>
      )}
    </div>
  )
}

function RosterBody({ chapter }: { chapter: StoryChapter }) {
  const cast = chapterCastMembers(chapter)
  return (
    <div>
      <h3 className="anvl-heading text-2xl font-normal leading-[0.98] text-[var(--color-heading)]">
        The Army
      </h3>
      <div className="mt-3 text-[13px]">
        <CastRoster cast={cast} title="Those written into this chapter" />
      </div>
    </div>
  )
}

function FlatCover({ chapter }: { chapter: StoryChapter }) {
  const cover = resolveBookCover(chapter)
  const { foil } = cover.colors
  return (
    <div className="story-page-enter flex min-h-0 flex-1 flex-col items-center justify-start gap-5 overflow-y-auto px-8 pt-[12%] text-center">
      <p className="anvl-display text-xs tracking-[0.42em]" style={{ color: foil }}>
        {cover.dropLabel}
      </p>
      {cover.logoSrc ? (
        <img src={cover.logoSrc} alt="" className="h-28 w-auto max-w-[70%] object-contain" />
      ) : (
        <span style={{ color: foil }}>
          <AnvlCrest className="h-28 w-28" />
        </span>
      )}
      <h2 className="anvl-heading text-[clamp(2rem,8vw,3.4rem)] font-normal leading-[0.88]" style={{ color: foil }}>
        {chapter.title}
      </h2>
      <span className="block h-px w-20" style={{ background: foil }} />
      <p className="anvl-display text-[11px] tracking-[0.46em]" style={{ color: foil, opacity: 0.8 }}>
        ANVL ATHLETICS
      </p>
    </div>
  )
}
