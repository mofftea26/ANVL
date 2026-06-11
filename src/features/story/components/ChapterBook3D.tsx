import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { BookSpread } from '@/features/story/lib/bookSpreads'
import { StudioStage } from '@/features/story/components/book3d/StudioStage'
import { resolveBookCover } from '@/features/story/components/book3d/bookConfig'
import { Book } from '@/features/story/components/book3d/Book'
import { OpenFlash } from '@/features/story/components/book3d/OpenFlash'

function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

interface ChapterBook3DProps {
  chapter: StoryChapter
  spreads: BookSpread[]
  current: number
  originRect: DOMRect | null
  /** A grabbed page committed a turn — advance/rewind the spread. */
  onTurn: (dir: 1 | -1) => void
}

/**
 * The opened book — the *same* cloth hardcover from the shelf, flown in from
 * its card, bloomed open, and read spread by spread. The book itself is not
 * draggable; only the paper is (grab a page to turn it — see `Book`). Tablets
 * get a capped device-pixel ratio to stay smooth.
 */
export default function ChapterBook3D(props: ChapterBook3DProps) {
  const maxDpr =
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 1.5 : 2

  return (
    <div className="relative h-[min(90svh,64rem)] w-[min(98vw,80rem)]">
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, maxDpr]}
        style={{ touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <StudioStage shadowY={-1.35} shadowOpacity={0.5}>
            <BookScene {...props} />
          </StudioStage>
        </Suspense>
      </Canvas>
    </div>
  )
}

function BookScene({ chapter, spreads, current, originRect, onTurn }: ChapterBook3DProps) {
  const introRef = useRef<THREE.Group>(null)
  const cover = resolveBookCover(chapter)
  const viewport = useThree((s) => s.viewport)

  const start = useMemo(() => {
    if (!originRect || typeof window === 'undefined') return null
    const cx = originRect.left + originRect.width / 2
    const cy = originRect.top + originRect.height / 2
    const ndcX = (cx / window.innerWidth) * 2 - 1
    const ndcY = -((cy / window.innerHeight) * 2 - 1)
    return {
      x: ndcX * (viewport.width / 2),
      y: ndcY * (viewport.height / 2),
      scale: Math.min(0.6, Math.max(0.22, originRect.height / window.innerHeight)),
    }
  }, [originRect, viewport.width, viewport.height])

  const introT = useRef(0)
  const opened = current >= 1
  const [flashSeq, setFlashSeq] = useState(0)
  const prevOpened = useRef(opened)
  useEffect(() => {
    if (opened && !prevOpened.current) setFlashSeq((s) => s + 1)
    prevOpened.current = opened
  }, [opened])

  useFrame((_state, delta) => {
    const g = introRef.current
    if (!g) return
    introT.current = Math.min(1, introT.current + delta / 1.1)
    const p = easeInOutCubic(introT.current)
    const s0 = start?.scale ?? 0.82
    g.scale.setScalar(s0 + (1 - s0) * p)
    g.position.x = (start?.x ?? 0) * (1 - p)
    // Arc gently upward mid-flight instead of travelling a straight line.
    g.position.y = (start?.y ?? -0.2) * (1 - p) + Math.sin(p * Math.PI) * 0.12
    g.position.z = -0.9 * (1 - p)
    // Yaw in from the card with a slight roll that levels out on landing.
    g.rotation.set(0, (1 - p) * 0.5, (1 - p) * -0.07)
  })

  return (
    <group ref={introRef}>
      <Book
        chapter={chapter}
        open={opened}
        hovered
        spin={false}
        spreads={spreads}
        current={current}
        onTurned={onTurn}
      />
      <OpenFlash color={cover.colors.foil} seq={flashSeq} />
    </group>
  )
}
