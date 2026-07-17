import { BookOpen } from '@/shared/icons'
import { AnvlCrest } from '@/shared/assets/brand'
import {
  formatChapterNumber,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'
import { StoryMedia } from '@/features/story/components/StoryMedia'

interface ChapterCoverProps {
  chapter: StoryChapter
  onOpen: (slug: string) => void
}

/** A closed "book" on the shelf. Clicking opens the chapter overlay. */
export function ChapterCover({ chapter, onOpen }: ChapterCoverProps) {
  const hasCover = resolveStoryAsset(chapter.cover).type !== 'none'
  const number = formatChapterNumber(chapter.chapterNumber)

  return (
    <button
      type="button"
      onClick={() => onOpen(chapter.slug)}
      className="focus-ring group relative flex w-full flex-col overflow-hidden rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] text-left transition-all duration-300 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--color-highlight)_55%,var(--color-line))]"
      aria-label={`Open Chapter ${number} — ${chapter.title}`}
    >
      {/* Spine accent. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[var(--color-highlight)] via-[color-mix(in_oklab,var(--color-highlight)_45%,transparent)] to-transparent opacity-80"
      />

      <span className="relative block aspect-[3/4] w-full overflow-hidden bg-[var(--color-bg)]">
        {hasCover ? (
          <StoryMedia
            asset={chapter.cover}
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[var(--color-graphite)]">
            <AnvlCrest className="h-24 w-24 opacity-40 transition-opacity duration-500 group-hover:opacity-60" />
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent opacity-90"
        />
        <span className="anvl-display absolute left-4 top-3 text-[clamp(2rem,5vw,3.5rem)] leading-none text-[var(--color-highlight)] opacity-90">
          {number}
        </span>
      </span>

      <span className="relative flex flex-1 flex-col p-3 sm:p-5">
        <span className="anvl-display text-[10px] tracking-[0.28em] text-[var(--color-highlight-bright)] sm:text-[11px]">
          {chapter.subtitle || `Chapter ${number}`}
        </span>
        <span className="anvl-heading mt-1.5 text-xl font-normal leading-[0.95] text-[var(--color-heading)] sm:mt-2 sm:text-[clamp(1.5rem,3vw,2.25rem)]">
          {chapter.title}
        </span>
        {chapter.description ? (
          <span className="mt-3 hidden text-sm leading-relaxed text-[var(--color-text-muted)] sm:line-clamp-3">
            {chapter.description}
          </span>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-highlight-bright)] sm:mt-4 sm:text-xs">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Open the chapter
        </span>
      </span>
    </button>
  )
}
