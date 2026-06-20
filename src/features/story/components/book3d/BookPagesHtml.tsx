import type { CSSProperties } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { spreadPageNumbers, type BookSpread } from '@/features/story/lib/bookSpreads'
import { BookLeftPage, BookRightPage } from '@/features/story/components/BookPageView'
import type { BookCover } from '@/features/story/components/book3d/bookConfig'
import {
  BOOK_T,
  COVER_W,
  HTML_DISTANCE,
  PAGE_PX_H,
  PAGE_PX_W,
  TOP_Z,
} from '@/features/story/components/book3d/bookGeometry'

interface BookPagesHtmlProps {
  chapter: StoryChapter
  cover: BookCover
  spreads: BookSpread[]
  /** Spread index rendered on each side — `null` hides that side (a leaf is
      covering it mid-turn, so DOM content must not float above the paper). */
  leftIndex: number | null
  rightIndex: number | null
}

/**
 * The readable page content — DOM, projected onto the two open page surfaces.
 * drei <Html> runs in SCREEN-SPACE mode (no `transform`): position comes from
 * a true camera projection of the anchor — the exact math WebGL paints with —
 * so the content tracks the page meshes on every screen size. (transform-mode
 * CSS-3D placed the scene ~4.6px from the CSS eye plane, where Chromium's
 * compositor paints diverge canvas-dependently.) The scale must include the
 * canvas height (drei's objectScale is pure camera math):
 * world = px · HTML_DISTANCE/400 → factor = h·HTML_DISTANCE/400.
 */
export function BookPagesHtml({
  chapter,
  cover,
  spreads,
  leftIndex,
  rightIndex,
}: BookPagesHtmlProps) {
  const size = useThree((s) => s.size)
  const dfScreen = (size.height * HTML_DISTANCE) / 400

  const pageBox: CSSProperties = {
    ['--color-heading']: cover.colors.heading,
    ['--color-text']: cover.colors.text,
    ['--color-text-muted']: cover.colors.text,
    width: PAGE_PX_W,
    height: PAGE_PX_H,
    overflow: 'hidden',
  } as CSSProperties

  const left = leftIndex != null ? spreads[leftIndex] : undefined
  const right = rightIndex != null ? spreads[rightIndex] : undefined

  return (
    <>
      {leftIndex != null && left?.kind === 'spread' ? (
        /* eps=-1 → refresh transform every frame; drei's position-guard can
           otherwise leave the overlay unscaled after its mount effect re-runs. */
        <Html
          center
          eps={-1}
          distanceFactor={dfScreen}
          position={[-COVER_W, 0, BOOK_T / 2 + 0.012]}
          style={{ pointerEvents: 'none' }}
          occlude={false}
        >
          <div className="story-book-page" style={pageBox}>
            <BookLeftPage
              key={left.key}
              spread={left}
              pageNo={spreadPageNumbers(spreads, leftIndex).left}
              total={spreadPageNumbers(spreads, leftIndex).total}
              foil={cover.colors.foil}
            />
          </div>
        </Html>
      ) : null}
      {rightIndex != null && right?.kind === 'spread' ? (
        <Html
          center
          eps={-1}
          distanceFactor={dfScreen}
          position={[0, 0, TOP_Z + 0.002]}
          style={{ pointerEvents: 'none' }}
          occlude={false}
        >
          <div className="story-book-page" style={pageBox}>
            <BookRightPage
              key={right.key}
              spread={right}
              chapter={chapter}
              pageNo={spreadPageNumbers(spreads, rightIndex).right}
              total={spreadPageNumbers(spreads, rightIndex).total}
              foil={cover.colors.foil}
            />
          </div>
        </Html>
      ) : null}
    </>
  )
}
