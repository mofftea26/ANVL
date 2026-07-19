import { useCallback, useEffect, useRef, useState } from 'react'
import { Container } from '@/shared/components/ui/Container'
import { cn } from '@/shared/lib/cn'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type {
  OathResolvedHotspot,
  OathResolvedContent,
} from '../content/oathContent.defaults'
import { OathProductViewer } from './OathProductViewer'
import { OathSceneSeam } from './OathSceneSeam'

/**
 * Scene 03 — The Arsenal. Desktop only (hidden below xl): a pinned panorama that
 * showcases the three Drop 01 pieces one per slide. Each slide pans horizontally
 * into view with its own smokey background, the product staged as a CMS-assigned
 * 3D model (GLB) — or an intentional plate until one is assigned — its
 * warrior-voiced title/subtitle, and up to four annotated callouts.
 *
 * Each callout is INTERACTIVE. Its resting state is a reticle marker plus a
 * compact label chip (the affordance) at the end of a leader line; the full,
 * premium spec card is COLLAPSED. On a fine pointer the card expands on hover /
 * keyboard focus of the marker; on a coarse pointer it toggles on tap (with
 * outside-tap + Escape to close). Only one card is open per slide.
 *
 * Reveal vs. interaction never fight over the same property: the GSAP scroll
 * timeline (`buildOathTenets`) reveals the RESTING state — it animates the dot,
 * the leader line, and the chip WRAPPER (`data-hotspot-chip`). The card
 * (`data-hotspot-card`) is React/CSS-owned (transform + opacity), untouched by
 * GSAP, and the chip's open/close fade lives on the chip's inner span, so the
 * two systems write to disjoint elements. The horizontal-on-scroll mechanic and
 * `tenets.items[]` content key are unchanged.
 */

/** Where the drawn media actually sits inside the stage box (px). */
type ContentRect = { left: number; top: number; width: number; height: number }

/**
 * ACCURACY CORE. Hotspot x/y are authored in the admin as percent of the IMAGE
 * itself, but the stage renders stills with `object-contain` — the drawn image
 * occupies only a letterboxed sub-rect of the stage, so naive `left: x%` of the
 * stage drifts whenever aspect ratios differ. This measures the contained rect
 * (natural aspect vs. stage box) and re-measures on resize/late load. Without a
 * still (GLB viewer / ember plate) the drawn media IS the stage → full box.
 */
function useContainedMediaRect(stageRef: React.RefObject<HTMLDivElement | null>) {
  const [rect, setRect] = useState<ContentRect | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const measure = () => {
      const box = stage.getBoundingClientRect()
      if (box.width < 2 || box.height < 2) return
      const img = stage.querySelector<HTMLImageElement>('img[data-tenet-media]')
      if (!img || !img.naturalWidth || !img.naturalHeight) {
        setRect({ left: 0, top: 0, width: box.width, height: box.height })
        return
      }
      const scale = Math.min(
        box.width / img.naturalWidth,
        box.height / img.naturalHeight,
      )
      const width = img.naturalWidth * scale
      const height = img.naturalHeight * scale
      setRect({
        left: (box.width - width) / 2,
        top: (box.height - height) / 2,
        width,
        height,
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    // Stills can finish decoding after mount — re-measure once natural size lands.
    const img = stage.querySelector<HTMLImageElement>('img[data-tenet-media]')
    img?.addEventListener('load', measure)
    return () => {
      observer.disconnect()
      img?.removeEventListener('load', measure)
    }
  }, [stageRef])

  return rect
}

/** Leader length between the reticle edge and the card (px). */
const LEADER_LENGTH = 44
/** Grace window before a hover/focus-out actually collapses the card (ms). */
const HOVER_CLOSE_GRACE = 140

type HotspotSide = 'right' | 'left'

interface HotspotProps {
  hotspot: OathResolvedHotspot
  rect: ContentRect | null
  open: boolean
  reduced: boolean
  /** Coarse pointer → tap-to-toggle; fine pointer → hover / focus to expand. */
  coarse: boolean
  onOpen: (id: string) => void
  onToggle: (id: string) => void
  onScheduleClose: (id: string) => void
}

/**
 * One annotated callout: reticle centered EXACTLY on the authored point, a
 * horizontal leader line, a resting label chip, and the big spec card — all on
 * whichever side has room (right when the point sits in the left half, left
 * otherwise), vertically clamped near the stage's top/bottom edges so the
 * larger card never hangs off the stage.
 *
 * Element roles are deliberately split so reveal and interaction can't collide:
 * - `data-hotspot-dot` / `data-hotspot-line` / `data-hotspot-chip` are GSAP
 *   reveal targets (the resting state) — layout transforms live on their
 *   WRAPPERS, never on these nodes.
 * - `data-hotspot-card` is React/CSS-owned; its open/close scale+opacity is a
 *   CSS transition driven by `data-open`, and GSAP never touches it.
 * - the chip's fade-on-open lives on the chip's INNER span, not the GSAP
 *   wrapper, so the timeline's opacity writes and the open-state opacity write
 *   to disjoint elements.
 */
function Hotspot({
  hotspot,
  rect,
  open,
  reduced,
  coarse,
  onOpen,
  onToggle,
  onScheduleClose,
}: HotspotProps) {
  const side: HotspotSide = hotspot.x < 55 ? 'right' : 'left'
  // Widened thresholds vs. the old small card: the taller card needs more edge
  // headroom before it flips to a top-/bottom-anchored grow.
  const vAlign: 'top' | 'center' | 'bottom' =
    hotspot.y < 26 ? 'top' : hotspot.y > 74 ? 'bottom' : 'center'

  // Pre-measure fallback = naive percent of the stage (SSR + first paint);
  // measured px against the drawn media rect replaces it immediately on mount.
  const position = rect
    ? {
        left: `${rect.left + (hotspot.x / 100) * rect.width}px`,
        top: `${rect.top + (hotspot.y / 100) * rect.height}px`,
      }
    : { left: `${hotspot.x}%`, top: `${hotspot.y}%` }

  const cardId = `oath-hotspot-card-${hotspot.id}`
  const jointOffset =
    side === 'right'
      ? 'left-[calc(9px+var(--oath-leader))]'
      : 'right-[calc(9px+var(--oath-leader))]'

  return (
    // pointerenter/leave here treat marker + leader + card as one hover region,
    // so moving from the marker to read the card keeps it open (fine pointer).
    <div
      data-hotspot={hotspot.id}
      className={cn('absolute h-0 w-0', open ? 'z-30' : 'z-20')}
      style={{ ...position, '--oath-leader': `${LEADER_LENGTH}px` } as React.CSSProperties}
      onPointerEnter={coarse ? undefined : () => onOpen(hotspot.id)}
      onPointerLeave={coarse ? undefined : () => onScheduleClose(hotspot.id)}
    >
      {/* Marker — a real button (44px hit target) centered EXACTLY on the point;
          the visible reticle sits inside. `aria-expanded` + `aria-controls`
          make it a disclosure trigger for the spec card. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={cardId}
        onClick={() => (coarse ? onToggle(hotspot.id) : onOpen(hotspot.id))}
        onFocus={coarse ? undefined : () => onOpen(hotspot.id)}
        onBlur={coarse ? undefined : () => onScheduleClose(hotspot.id)}
        className="focus-ring absolute left-0 top-0 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full"
      >
        <span className="sr-only">{hotspot.label}</span>
        <span aria-hidden="true" className="relative block h-[18px] w-[18px]">
          <span
            data-hotspot-dot
            className="block h-full w-full rounded-full border border-[var(--color-highlight-bright)]/80 bg-[color-mix(in_srgb,var(--color-highlight)_14%,transparent)] shadow-[0_0_10px_color-mix(in_srgb,var(--color-highlight)_45%,transparent)]"
          >
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-highlight-bright)]" />
          </span>
        </span>
      </button>

      {/* Horizontal leader from the reticle edge toward the card. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0 block h-px w-[var(--oath-leader)] -translate-y-1/2',
          side === 'right' ? 'left-[9px]' : 'right-[9px]',
        )}
      >
        <span
          data-hotspot-line
          data-side={side}
          className={cn(
            'block h-full w-full',
            side === 'right'
              ? 'bg-[linear-gradient(90deg,var(--color-highlight-bright),color-mix(in_srgb,var(--color-highlight)_45%,transparent))]'
              : 'bg-[linear-gradient(270deg,var(--color-highlight-bright),color-mix(in_srgb,var(--color-highlight)_45%,transparent))]',
          )}
        />
      </span>

      {/* Resting affordance — a compact label chip at the leader end. The GSAP
          reveal target is the wrapper (`data-hotspot-chip`); the inner span
          fades out as the card takes over so the label never doubles. */}
      <div
        className={cn(
          'pointer-events-none absolute top-0 -translate-y-1/2',
          jointOffset,
        )}
      >
        <span data-hotspot-chip data-side={side} className="block">
          <span
            aria-hidden="true"
            className={cn(
              'anvl-display block whitespace-nowrap rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_86%,transparent)] px-2.5 py-1 text-[0.5rem] uppercase tracking-[0.24em] text-[var(--color-highlight-bright)] backdrop-blur-sm',
              side === 'right'
                ? 'border-l-[1.5px] border-l-[var(--color-highlight-bright)]'
                : 'border-r-[1.5px] border-r-[var(--color-highlight-bright)]',
              reduced ? '' : 'transition-opacity duration-200 ease-out',
              open ? 'opacity-0' : 'opacity-100',
            )}
          >
            {hotspot.label}
          </span>
        </span>
      </div>

      {/* Spec card — expanded disclosure. Wrapper owns vertical clamp; the card
          itself owns the open/close scale+opacity (CSS transition, or instant
          under reduced motion). Grows from the joint edge toward the roomy side. */}
      <div
        className={cn(
          'absolute',
          jointOffset,
          vAlign === 'center' && '-translate-y-1/2',
          vAlign === 'top' && '-translate-y-5',
          vAlign === 'bottom' && '-translate-y-[calc(100%-1.5rem)]',
        )}
      >
        <div
          id={cardId}
          data-hotspot-card
          data-side={side}
          data-open={open ? 'true' : 'false'}
          aria-hidden={open ? undefined : true}
          className={cn(
            'w-72 overflow-hidden rounded-lg border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] shadow-[0_18px_48px_-16px_rgba(0,0,0,0.7)] backdrop-blur-md',
            side === 'right'
              ? 'origin-left border-l-[2px] border-l-[var(--color-highlight-bright)]'
              : 'origin-right border-r-[2px] border-r-[var(--color-highlight-bright)]',
            reduced ? '' : 'transition-[transform,opacity] duration-[280ms] ease-out',
            open
              ? 'scale-100 opacity-100'
              : 'pointer-events-none scale-[0.94] opacity-0',
          )}
        >
          {hotspot.bubbleUrl ? (
            // Full-width editorial image header with the label as an eyebrow
            // riding the scrim.
            <div className="relative h-28 w-full overflow-hidden">
              <img
                src={hotspot.bubbleUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--color-bg)_94%,transparent),transparent_62%)]"
              />
              <p className="anvl-display absolute inset-x-3.5 bottom-2.5 text-[0.62rem] uppercase leading-[1.3] tracking-[0.24em] text-[var(--color-highlight-bright)]">
                {hotspot.label}
              </p>
            </div>
          ) : null}
          <div className="p-4">
            {hotspot.bubbleUrl ? null : (
              // No image → a forged copper seam + eyebrow so the card still reads
              // as an intentional spec plate (never an empty image hole).
              <>
                <span
                  aria-hidden="true"
                  className="mb-3 block h-px w-8 bg-[var(--color-highlight-bright)]"
                />
                <p className="anvl-display text-[0.62rem] uppercase leading-[1.3] tracking-[0.24em] text-[var(--color-highlight-bright)]">
                  {hotspot.label}
                </p>
              </>
            )}
            <p
              className={cn(
                'text-[0.82rem] leading-[1.55] text-[var(--color-text-muted)]',
                hotspot.bubbleUrl ? '' : 'mt-2',
              )}
            >
              {hotspot.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Product stage + measured, accurately-anchored, interactive callout layer. */
function AnnotatedStage({
  item,
}: {
  item: OathResolvedContent['tenets']['items'][number]
}) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const rect = useContainedMediaRect(stageRef)
  const reduced = useReducedMotion()

  // Only one callout open per slide (opening one closes the rest).
  const [openId, setOpenId] = useState<string | null>(null)
  // Pointer model. SSR-safe: default to the hover model, refine after mount.
  const [coarse, setCoarse] = useState(false)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const onChange = () => setCoarse(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const clearTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const openHotspot = useCallback(
    (id: string) => {
      clearTimer()
      setOpenId(id)
    },
    [clearTimer],
  )

  const toggleHotspot = useCallback(
    (id: string) => {
      clearTimer()
      setOpenId((cur) => (cur === id ? null : id))
    },
    [clearTimer],
  )

  // Hover/focus-out closes after a short grace so crossing the leader gap
  // between marker and card doesn't flicker it shut.
  const scheduleClose = useCallback(
    (id: string) => {
      clearTimer()
      closeTimer.current = window.setTimeout(() => {
        setOpenId((cur) => (cur === id ? null : cur))
        closeTimer.current = null
      }, HOVER_CLOSE_GRACE)
    },
    [clearTimer],
  )

  const closeAll = useCallback(() => {
    clearTimer()
    setOpenId(null)
  }, [clearTimer])

  // Escape always closes; an outside tap closes on coarse pointers. Listeners
  // only exist while something is open, so nothing leaks at rest.
  useEffect(() => {
    if (openId === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAll()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!coarse) return
      const target = event.target as Element | null
      if (target && target.closest('[data-hotspot]')) return
      closeAll()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [openId, coarse, closeAll])

  // Flush any pending grace timer on unmount.
  useEffect(() => clearTimer, [clearTimer])

  return (
    <div ref={stageRef} className="relative mx-auto h-[78%] w-full max-w-2xl">
      <OathProductViewer
        modelUrl={item.modelUrl}
        mediaUrl={item.mediaUrl}
        tone={item.tone}
        alt={item.title}
      />
      {item.hotspots.map((hotspot) => (
        <Hotspot
          key={hotspot.id}
          hotspot={hotspot}
          rect={rect}
          open={openId === hotspot.id}
          reduced={reduced}
          coarse={coarse}
          onOpen={openHotspot}
          onToggle={toggleHotspot}
          onScheduleClose={scheduleClose}
        />
      ))}
    </div>
  )
}

export function OathTenets({
  tenets,
}: {
  tenets: OathResolvedContent['tenets']
}) {
  const items = tenets.items
  return (
    <section
      data-scene="tenets"
      aria-labelledby="oath-tenets-heading"
      className="relative hidden w-full xl:block"
    >
      <h2 id="oath-tenets-heading" className="sr-only">
        {tenets.eyebrow}
      </h2>

      <div
        data-tenet-stage
        className="relative h-[100svh] overflow-hidden bg-[var(--color-bg)]"
      >
        <OathSceneSeam edges="top" />

        {/* Fixed section chrome while the panorama pans beneath. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[min(17rem,21vw)]">
          <Container className="flex h-full max-w-none px-6 xl:px-8">
            {/* Title (top) + "NN pieces · scroll" footer (bottom) nudged down by
                half the top bar so they clear the transparent header; the
                panorama itself (centred) is unaffected. */}
            <div className="flex h-full flex-col justify-between py-14 pr-8 [transform:translateY(calc(var(--anvl-header-h)/2))]">
              <div>
                <p
                  data-tenet-eyebrow
                  className="anvl-display text-[0.62rem] tracking-[0.38em] text-[var(--color-heading)]/90"
                >
                  {tenets.eyebrow}
                </p>
                <div
                  aria-hidden="true"
                  className="mt-5 h-px w-12 bg-[var(--color-highlight-bright)]"
                />
              </div>
              <p className="anvl-display text-[0.52rem] leading-relaxed tracking-[0.28em] text-[var(--color-text-muted)]">
                {items.length.toString().padStart(2, '0')} pieces · scroll
              </p>
            </div>
          </Container>
        </div>

        <div data-tenet-track className="flex h-full w-full will-change-transform">
          {items.map((item) => (
            <article
              key={item.id}
              data-tenet={item.id}
              className="relative h-full w-full shrink-0 overflow-hidden"
              aria-label={`${item.index} — ${item.title}`}
            >
              {/* Smokey background. Its left/right edges feather into the stage
                  void (horizontal mask) so adjacent slides cross-dissolve as the
                  strip pans — no hard vertical seam where one piece meets the next. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent_0%,#000_14%,#000_86%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_14%,#000_86%,transparent_100%)]"
              >
                {item.bgUrl ? (
                  <img
                    src={item.bgUrl}
                    alt=""
                    data-tenet-bg
                    className="h-full w-full object-cover opacity-70"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(100deg, color-mix(in srgb, var(--color-bg) 92%, transparent) 0%, color-mix(in srgb, var(--color-bg) 50%, transparent) 34%, transparent 60%)',
                  }}
                />
              </div>

              <Container className="relative z-10 h-full">
                <div className="grid h-full grid-cols-[minmax(17rem,28%)_1fr] items-center gap-8 pl-[min(14rem,18vw)]">
                  {/* Title block. */}
                  <div className="max-w-sm">
                    <span
                      data-tenet-index
                      aria-hidden="true"
                      className="anvl-heading block font-normal tabular-nums leading-[0.82] tracking-[-0.04em] text-[var(--color-heading)]/12 text-[clamp(4rem,9vw,7.5rem)]"
                    >
                      {item.index}
                    </span>
                    <p
                      data-tenet-marker
                      className="anvl-display mt-4 text-[0.58rem] tracking-[0.36em] text-[var(--color-highlight-bright)]"
                    >
                      {item.marker}
                    </p>
                    <h3
                      data-tenet-title
                      className="anvl-heading mt-3 font-normal leading-[0.92] tracking-[-0.015em] text-[var(--color-heading)] text-[clamp(2rem,3.6vw,3.4rem)]"
                    >
                      {item.title}
                    </h3>
                    <p
                      data-tenet-sub
                      className="mt-4 max-w-xs text-[0.92rem] leading-[1.6] text-[var(--color-text-muted)]"
                    >
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Product stage + annotated hotspots (measured anchoring). */}
                  <AnnotatedStage item={item} />
                </div>
              </Container>
            </article>
          ))}
        </div>

        <OathSceneSeam edges="bottom" />
      </div>
    </section>
  )
}
