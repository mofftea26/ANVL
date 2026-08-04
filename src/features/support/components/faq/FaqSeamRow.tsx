import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { cn } from '@/shared/lib/cn'
import { splitParagraphs } from '../ProseBody'
import { FaqHighlightedText } from './FaqHighlightedText'
import type { ResolvedFaqItem } from '@/features/cms/support/resolveSupportContent'

/**
 * A single forged plate in the FAQ seam stack.
 *
 * Closed it reads as cold steel with a hairline seam along its lower edge.
 * Hover runs a specular heat-scan that tracks the pointer (transform-only, via
 * the `--faq-mx` custom property the plate carries). Opening splits the plate
 * along that seam: the seam core scales out from wherever the pointer struck,
 * sparks lift off the crack, and the answer's paragraphs wipe in on a stagger.
 *
 * Motion is GSAP-gated to `≥768px + no-reduced-motion`; below that the plate
 * still opens (CSS `grid-template-rows`) with no sparks and no wipe, and the
 * content is fully readable. The panel stays in the DOM when collapsed so the
 * answers remain crawlable — it is `inert` + `aria-hidden` instead.
 */

/** Deterministic spark field — [leftPct, driftX, riseY, delay, size]. No RNG: SSR-safe. */
const SPARKS: ReadonlyArray<[number, number, number, number, number]> = [
  [12, -14, -46, 0, 2],
  [24, 8, -62, 0.05, 3],
  [37, -6, -38, 0.12, 2],
  [46, 16, -70, 0.02, 2],
  [55, -18, -52, 0.09, 3],
  [63, 6, -34, 0.16, 2],
  [72, -10, -66, 0.06, 2],
  [84, 14, -44, 0.13, 3],
  [92, -8, -56, 0.2, 2],
]

const OPEN_MOTION_MQ = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

export interface FaqSeamRowProps {
  item: ResolvedFaqItem
  /** 0-based position in the *unfiltered* list — drives the stamped serial. */
  index: number
  open: boolean
  query: string
  onToggle: (id: string) => void
  onTriggerKeyDown: (event: KeyboardEvent<HTMLButtonElement>, id: string) => void
  registerTrigger: (id: string, node: HTMLButtonElement | null) => void
}

export function FaqSeamRow({
  item,
  index,
  open,
  query,
  onToggle,
  onTriggerKeyDown,
  registerTrigger,
}: FaqSeamRowProps) {
  const rootRef = useRef<HTMLLIElement | null>(null)
  const paragraphs = splitParagraphs(item.answer)
  const triggerId = `faq-trigger-${item.id}`
  const panelId = `faq-panel-${item.id}`
  const serial = String(index + 1).padStart(2, '0')

  /**
   * Records where the pointer crossed the plate so the heat-scan band and the
   * seam's split origin follow it. Written straight to the element's style —
   * this fires on every pointer move and must not re-render React.
   */
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const root = rootRef.current
    if (!root) return
    const x = event.clientX - root.getBoundingClientRect().left
    root.style.setProperty('--faq-mx', `${x}px`)
  }

  useGSAP(
    () => {
      if (!open) return
      const mm = gsap.matchMedia()
      mm.add(OPEN_MOTION_MQ, () => {
        const sparks = gsap.utils.toArray<HTMLElement>('[data-faq-spark]', rootRef.current)
        sparks.forEach((spark) => {
          const driftX = Number(spark.dataset.dx ?? 0)
          const riseY = Number(spark.dataset.dy ?? 0)
          const delay = Number(spark.dataset.delay ?? 0)
          gsap.fromTo(
            spark,
            { x: 0, y: 0, opacity: 1, scale: 1 },
            {
              x: driftX,
              y: riseY,
              opacity: 0,
              scale: 0.2,
              duration: 1.1,
              delay,
              ease: 'power2.out',
            },
          )
        })

        const lines = gsap.utils.toArray<HTMLElement>('[data-faq-line]', rootRef.current)
        gsap.fromTo(
          lines,
          { yPercent: 26, opacity: 0, clipPath: 'inset(0 100% 0 0)' },
          {
            yPercent: 0,
            opacity: 1,
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.72,
            delay: 0.14,
            stagger: 0.09,
            ease: 'power3.out',
          },
        )
      })
      return () => mm.revert()
    },
    { dependencies: [open], scope: rootRef },
  )

  return (
    <li
      ref={rootRef}
      id={`faq-${item.id}`}
      data-open={open ? 'true' : 'false'}
      className="anvl-faq-plate scroll-mt-28"
      onPointerMove={handlePointerMove}
    >
      {/* The head owns the seam: the crack must stay on the trigger's lower
          edge — i.e. exactly where the plate splits — not at the bottom of the
          plate, which travels downward as the answer expands. */}
      <h3 className="anvl-faq-head">
        <button
          ref={(node) => registerTrigger(item.id, node)}
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(item.id)}
          onKeyDown={(event) => onTriggerKeyDown(event, item.id)}
          className="anvl-faq-trigger focus-ring"
        >
          {/* Specular heat-scan, tracking the pointer. */}
          <span aria-hidden="true" className="anvl-faq-scan">
            <span className="anvl-faq-scan-band" />
          </span>

          <span className="anvl-faq-serial anvl-display" aria-hidden="true">
            {serial}
          </span>

          <span className="anvl-faq-question">
            <FaqHighlightedText text={item.question} query={query} />
          </span>

          <span aria-hidden="true" className="anvl-faq-glyph">
            <span className="anvl-faq-glyph-bar" />
            <span className="anvl-faq-glyph-bar anvl-faq-glyph-bar--v" />
          </span>
        </button>

        {/* The seam: a hairline crack that goes molten and splits from the strike point. */}
        <span aria-hidden="true" className="anvl-faq-seam">
          <span className="anvl-faq-seam-core" />
        </span>
        <span aria-hidden="true" className="anvl-faq-sparks">
          {SPARKS.map(([left, dx, dy, delay, size], i) => (
            <span
              key={i}
              data-faq-spark=""
              data-dx={dx}
              data-dy={dy}
              data-delay={delay}
              className="anvl-faq-spark"
              style={{ left: `${left}%`, width: `${size}px`, height: `${size}px` }}
            />
          ))}
        </span>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!open}
        inert={!open}
        className={cn('anvl-faq-panel', open && 'anvl-faq-panel--open')}
      >
        <div className="anvl-faq-panel-clip">
          <div className="anvl-faq-panel-body">
            {paragraphs.map((paragraph, i) => (
              <p key={i} data-faq-line="" className="anvl-faq-answer">
                <FaqHighlightedText text={paragraph} query={query} />
              </p>
            ))}
          </div>
        </div>
      </div>
    </li>
  )
}
