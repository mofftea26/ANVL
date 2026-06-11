import { Container, Section } from '@/shared/components/ui'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { ChapterCover } from '@/features/story/components/ChapterCover'

interface ChapterShelfProps {
  chapters: StoryChapter[]
  onOpen: (slug: string) => void
}

/** The library shelf — every published chapter rendered as an openable book. */
export function ChapterShelf({ chapters, onOpen }: ChapterShelfProps) {
  return (
    <Section>
      <Container>
        <RevealOnScroll>
          <p className="anvl-display flex items-center gap-2.5 text-xs tracking-[0.3em] text-[var(--color-ember-bright)] before:h-px before:w-8 before:bg-[var(--color-ember)] before:content-['']">
            The Chronicle
          </p>
          <h2 className="anvl-heading mt-4 max-w-2xl text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[0.95]">
            Every drop is a chapter. Open one to read the saga.
          </h2>
        </RevealOnScroll>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3">
          {chapters.map((chapter) => (
            <RevealOnScroll key={chapter.id}>
              <ChapterCover chapter={chapter} onOpen={onOpen} />
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </Section>
  )
}
