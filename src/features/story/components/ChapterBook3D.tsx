import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useCanvasTeardownMark } from '@/shared/webgl/canvasTeardownGuard'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { BookSpread } from '@/features/story/lib/bookSpreads'
import { StudioStage } from '@/features/story/components/book3d/StudioStage'
import { resolveBookCover } from '@/features/story/components/book3d/bookConfig'
import { Book } from '@/features/story/components/book3d/Book'
import { OpenFlash } from '@/features/story/components/book3d/OpenFlash'
import { EmberField } from '@/features/story/components/book3d/EmberField'
import {
  easeInOutCubic,
  easeOutQuart,
} from '@/features/story/components/book3d/bookGeometry'
import { readThemeCssColor } from '@/shared/lib/themeColor'

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
  useCanvasTeardownMark()

  return (
    <div className="relative h-[min(90svh,64rem)] w-[min(98vw,80rem)]">
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 38 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
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
  const leanT = useRef(0)
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
    // — The flight: one decisive pull from the shelf card to centre stage.
    //   easeOutQuart arrives fast and glides into the settle, so the cover
    //   (which cracks open during the final glide) reads as the same gesture —
    //   pull the book to you and open it, not two separate steps.
    introT.current = Math.min(1, introT.current + delta / 0.95)
    const p = easeOutQuart(introT.current)
    // — The lean-in: once the cover starts opening, the book eases a breath
    //   closer and larger — the reader bending over the page.
    leanT.current = Math.max(0, Math.min(1, leanT.current + (opened ? delta / 1.2 : -delta / 0.6)))
    const lean = easeInOutCubic(leanT.current)

    const s0 = start?.scale ?? 0.82
    g.scale.setScalar((s0 + (1 - s0) * p) * (1 + 0.05 * lean))
    g.position.x = (start?.x ?? 0) * (1 - p)
    // A higher arc mid-flight — the book is lifted off the shelf, not slid.
    g.position.y = (start?.y ?? -0.2) * (1 - p) + Math.sin(p * Math.PI) * 0.17
    g.position.z = -1.1 * (1 - p) + 0.22 * lean
    // Sweeps in from the card three-quarter view, tipping up to face the
    // reader, and levels its roll as it lands.
    g.rotation.set((1 - p) * 0.16, (1 - p) * 0.85, (1 - p) * -0.11)
  })

  return (
    <>
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
      {/* The reading room: drifting forge embers + a candle-warm flicker. The
          atmosphere stays outside the fly-in group so it never travels. */}
      <EmberField color={cover.colors.foil} active={opened} />
      <CandleFlicker active={opened} />
    </>
  )
}

/** A faint warm key that breathes like candlelight once the book lies open. */
function CandleFlicker({ active }: { active: boolean }) {
  const light = useRef<THREE.PointLight>(null)
  // Candle glow follows the active theme ember (CMS-controlled).
  const candleColor = useMemo(() => readThemeCssColor('--color-highlight', '#ffb066'), [])
  useFrame((state, delta) => {
    const l = light.current
    if (!l) return
    const t = state.clock.elapsedTime
    const target = active
      ? 0.5 + 0.07 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 13.1) + 0.03 * Math.sin(t * 23.7)
      : 0
    l.intensity += (target - l.intensity) * Math.min(1, delta * 6)
  })
  return (
    <pointLight
      ref={light}
      position={[1.5, 0.6, 1.9]}
      color={candleColor}
      intensity={0}
      distance={7}
      decay={1.7}
    />
  )
}
