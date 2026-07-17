import { useState } from 'react'
import { BookOpen } from '@/shared/icons'
import {
  formatChapterNumber,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'
import BookCanvas from '@/features/story/components/book3d/BookCanvas'
import { setOpenOrigin } from '@/features/story/components/book3d/openOrigin'

interface ChapterShelfCardProps {
  chapter: StoryChapter
  onOpen: (slug: string) => void
}

/**
 * Shelf card with a live 3D book as its cover. The semantics stay in the DOM —
 * a real `<button>` with number/title/subtitle — so the shelf is keyboard- and
 * screen-reader-accessible; the canvas is purely the visual.
 */
export function ChapterShelfCard({ chapter, onOpen }: ChapterShelfCardProps) {
  const [hovered, setHovered] = useState(false)
  const number = formatChapterNumber(chapter.chapterNumber)

  return (
    <button
      type="button"
      onClick={(e) => {
        setOpenOrigin(e.currentTarget.getBoundingClientRect())
        onOpen(chapter.slug)
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="focus-ring group relative flex w-full flex-col overflow-hidden rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] text-left transition-colors duration-300 hover:border-[color-mix(in_oklab,var(--color-highlight)_55%,var(--color-line))]"
      aria-label={`Open Chapter ${number} — ${chapter.title}`}
    >
      <span className="relative block aspect-[3/4] w-full overflow-hidden bg-[radial-gradient(120%_90%_at_50%_15%,#15161a_0%,var(--color-bg)_70%)]">
        <BookCanvas chapter={chapter} hovered={hovered} />
        <span className="anvl-display pointer-events-none absolute left-4 top-3 text-[clamp(2rem,5vw,3.5rem)] leading-none text-[var(--color-highlight)] opacity-90 mix-blend-screen">
          {number}
        </span>
      </span>

      <span className="relative flex flex-1 flex-col p-5">
        <span className="anvl-display text-[11px] tracking-[0.28em] text-[var(--color-highlight-bright)]">
          {chapter.subtitle || `Chapter ${number}`}
        </span>
        <span className="anvl-heading mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-normal leading-[0.95] text-[var(--color-heading)]">
          {chapter.title}
        </span>
        {chapter.description ? (
          <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {chapter.description}
          </span>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-highlight-bright)]">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Open the chapter
        </span>
      </span>
    </button>
  )
}
