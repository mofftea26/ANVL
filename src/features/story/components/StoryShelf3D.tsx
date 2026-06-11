import { Container, Section } from '@/shared/components/ui'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { ChapterShelfCard } from '@/features/story/components/ChapterShelfCard'

interface StoryShelf3DProps {
  chapters: StoryChapter[]
  onOpen: (slug: string) => void
}

/** The library shelf rendered with live 3D book covers (WebGL-capable clients). */
export default function StoryShelf3D({ chapters, onOpen }: StoryShelf3DProps) {
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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter) => (
            <RevealOnScroll key={chapter.id}>
              <ChapterShelfCard chapter={chapter} onOpen={onOpen} />
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </Section>
  )
}
