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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
