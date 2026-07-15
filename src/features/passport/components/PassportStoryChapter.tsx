import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { StoryMedia } from '@/features/story/components/StoryMedia'

/**
 * The product's saga chapter, embedded INSIDE the passport (no redirect, no
 * 3D book): acts stacked vertically — numeral, title, paragraphs, act media.
 * Reuses the story feature's asset resolver/renderer so CMS-authored chapters
 * look identical here and in the saga.
 */
export function PassportStoryChapter({ chapter }: { chapter: StoryChapter }) {
  return (
    <div className="max-w-xl space-y-10">
      <header>
        {chapter.dropLabel ? (
          <p className="anvl-micro text-[var(--color-text-muted)]">{chapter.dropLabel}</p>
        ) : null}
        <p className="anvl-heading mt-1 text-xl text-[var(--color-heading)]">
          {chapter.title}
        </p>
        {chapter.subtitle ? (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{chapter.subtitle}</p>
        ) : null}
        {chapter.description ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {chapter.description}
          </p>
        ) : null}
      </header>

      {chapter.acts.map((act, i) => (
        <article key={act.id}>
          <div className="flex items-baseline gap-3">
            <span className="anvl-heading text-lg text-[var(--color-highlight-bright)]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="anvl-heading text-base text-[var(--color-heading)]">{act.title}</h3>
          </div>
          <div className="mt-3 space-y-3">
            {act.story
              .split('\n\n')
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, j) => (
                <p
                  key={j}
                  className="text-sm leading-relaxed text-[var(--color-text-muted)]"
                >
                  {paragraph}
                </p>
              ))}
          </div>
          <StoryMedia
            asset={act.asset}
            className="mt-4 max-h-[32vh] rounded-xl border border-[var(--color-line)] object-cover"
          />
        </article>
      ))}
    </div>
  )
}
