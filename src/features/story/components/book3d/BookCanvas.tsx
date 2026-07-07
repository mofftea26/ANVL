import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { StudioStage } from '@/features/story/components/book3d/StudioStage'
import { Book } from '@/features/story/components/book3d/Book'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'

interface BookCanvasProps {
  chapter: StoryChapter
  hovered: boolean
}

/** Small WebGL canvas rendering one closed book — the cover visual of a shelf card. */
export default function BookCanvas({ chapter, hovered }: BookCanvasProps) {
  useCanvasTeardownMark()
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.4], fov: 32 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <StudioStage shadowY={-1.3} shadowOpacity={0.4}>
          <Book chapter={chapter} open={false} hovered={hovered} />
        </StudioStage>
      </Suspense>
    </Canvas>
  )
}
