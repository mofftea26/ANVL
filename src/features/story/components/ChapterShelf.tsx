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
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
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
