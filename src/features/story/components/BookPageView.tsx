import { AnvlCrest } from '@/shared/assets/brand'
import { formatChapterNumber, type StoryChapter } from '@/features/story/schemas/story.schema'
import { StoryMedia } from '@/features/story/components/StoryMedia'
import { CastRoster } from '@/features/story/components/CastRoster'
import { CastText } from '@/features/story/components/CastMention'
import { chapterCastMembers } from '@/features/story/lib/chapterPages'
import type { StoryCastMember } from '@/features/story/schemas/story.schema'
import type { BookSpread } from '@/features/story/lib/bookSpreads'

type Spread = Extract<BookSpread, { kind: 'spread' }>

interface PageProps {
  spread: Spread
  chapter: StoryChapter
  pageNo: number
  total: number
  foil: string
}

/** Running header pinned to the top of the page. */
function PageHeader({ left, right }: { left: string; right: string }) {
  return (
    <header className="absolute inset-x-[34px] top-[18px] flex items-baseline justify-between gap-3 border-b border-[var(--color-line)] pb-2">
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
 * body strictly bounded between them. Content is printed, not animated — the
 * page itself moves; the ink stays still, like a real book.
 */
export function BookRightPage({ spread, chapter, pageNo, total }: PageProps) {
  return (
    <article className="relative h-full w-full overflow-hidden">
      <PageHeader
        left={spread.chapterTitle}
        right={spread.roster ? 'The Army' : `Act ${formatChapterNumber(spread.actNumber)}`}
      />

      <div className="absolute inset-x-[34px] bottom-[52px] top-[54px] overflow-hidden">
        {spread.roster ? (
          <RosterBody chapter={chapter} />
        ) : (
          <ActBody spread={spread} cast={chapter.cast} />
        )}
      </div>

      <PageFooter pageNo={pageNo} total={total} side="right" />
    </article>
  )
}

function ActBody({ spread, cast }: { spread: Spread; cast: readonly StoryCastMember[] }) {
  return (
    <div className="space-y-3.5">
      {spread.part === 1 ? (
        <header className="mb-1">
          <p className="anvl-display text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
            Act {formatChapterNumber(spread.actNumber)}
          </p>
          <h3 className="anvl-heading mt-1 text-[1.85rem] font-normal leading-[0.98] text-[var(--color-heading)]">
            {spread.actTitle}
          </h3>
        </header>
      ) : (
        <p className="anvl-display text-[10px] tracking-[0.26em] text-[var(--color-text-muted)]">
          {spread.actTitle} — continued
        </p>
      )}
      <span className="block h-px w-12 bg-[var(--color-text-muted)] opacity-40" />

      {spread.paras.map((text, i) => (
        <p key={i} className="text-[15.5px] leading-[1.6] text-[var(--color-text-muted)]">
          <CastText text={text} cast={cast} />
        </p>
      ))}
    </div>
  )
}

function RosterBody({ chapter }: { chapter: StoryChapter }) {
  const cast = chapterCastMembers(chapter)
  return (
    <div>
      <h3 className="anvl-heading text-[1.7rem] font-normal leading-[0.98] text-[var(--color-heading)]">
        The Army
      </h3>
      <span className="mt-2 block h-px w-12 bg-[var(--color-text-muted)] opacity-40" />
      <div className="mt-3 text-[12px]">
        <CastRoster cast={cast} title="Those written into this chapter" />
      </div>
    </div>
  )
}

/**
 * Left (verso) page — always visual: the act's asset as a framed plate, or an
 * illuminated emblem (crest, numeral, chapter + act titles). Carries its own
 * running header and folio.
 */
export function BookLeftPage({ spread, pageNo, total, foil }: Omit<PageProps, 'chapter'>) {
  const isMedia = spread.left.type === 'media'

  return (
    <article className="relative h-full w-full overflow-hidden">
      <PageHeader left={spread.dropLabel} right={spread.chapterTitle} />

      {isMedia && spread.left.type === 'media' ? (
        <>
          <figure className="absolute inset-x-[34px] bottom-[108px] top-[54px] overflow-hidden rounded-sm border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-bg)_60%,#000)]">
            <StoryMedia asset={spread.left.asset} className="absolute inset-0" />
          </figure>
          <figcaption className="absolute inset-x-[34px] bottom-[52px] flex h-[48px] flex-col items-center justify-center text-center">
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
          <span style={{ color: foil }}>
            <AnvlCrest className="h-14 w-14" />
          </span>
          <p className="anvl-heading text-[5.2rem] font-normal leading-none" style={{ color: foil }}>
            {spread.roster ? '✶' : formatChapterNumber(spread.actNumber)}
          </p>
          <span className="block h-px w-16" style={{ background: foil }} />
          <div>
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
