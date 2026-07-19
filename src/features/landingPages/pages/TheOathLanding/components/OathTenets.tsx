import { useEffect, useRef, useState } from 'react'
import { Container } from '@/shared/components/ui/Container'
import { cn } from '@/shared/lib/cn'
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
 * warrior-voiced title/subtitle, and up to four annotated callouts (a reticle
 * marker, a horizontal leader line, and a spec card with the material/tech and
 * an optional chip image). The horizontal-on-scroll mechanic and
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

/**
 * One annotated callout: reticle centered EXACTLY on the point, a horizontal
 * leader line, and the spec card on whichever side has room (right when the
 * point sits in the left half, left otherwise), vertically centered on the
 * point but clamped near the stage's top/bottom edges — deterministic from the
 * authored position, so nothing ever hangs off the stage.
 */
function Hotspot({
  hotspot,
  rect,
}: {
  hotspot: OathResolvedHotspot
  rect: ContentRect | null
}) {
  const side: 'right' | 'left' = hotspot.x < 55 ? 'right' : 'left'
  const vAlign: 'top' | 'center' | 'bottom' =
    hotspot.y < 18 ? 'top' : hotspot.y > 82 ? 'bottom' : 'center'

  // Pre-measure fallback = naive percent of the stage (SSR + first paint);
  // measured px against the drawn media rect replaces it immediately on mount.
  const position = rect
    ? {
        left: `${rect.left + (hotspot.x / 100) * rect.width}px`,
        top: `${rect.top + (hotspot.y / 100) * rect.height}px`,
      }
    : { left: `${hotspot.x}%`, top: `${hotspot.y}%` }

  // Layout transforms (centering, edge clamping) live on WRAPPER elements;
  // the `data-hotspot-*` children are the GSAP targets, so the timeline's
  // scale/x/opacity writes never clobber the alignment transforms.
  return (
    <div
      data-hotspot={hotspot.id}
      className="absolute z-20 h-0 w-0"
      style={{ ...position, '--oath-leader': `${LEADER_LENGTH}px` } as React.CSSProperties}
    >
      {/* Reticle — wrapper centers it EXACTLY on the authored point. */}
      <span className="absolute left-0 top-0 block h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2">
        <span
          data-hotspot-dot
          className="block h-full w-full rounded-full border border-[var(--color-highlight-bright)]/80 bg-[color-mix(in_srgb,var(--color-highlight)_14%,transparent)] shadow-[0_0_10px_color-mix(in_srgb,var(--color-highlight)_45%,transparent)]"
        >
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-highlight-bright)]" />
        </span>
      </span>

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

      {/* Spec card — meets the leader flush; copper seam on the joint edge. */}
      <div
        className={cn(
          'absolute w-60',
          side === 'right'
            ? 'left-[calc(9px+var(--oath-leader))]'
            : 'right-[calc(9px+var(--oath-leader))]',
          vAlign === 'center' && '-translate-y-1/2',
          vAlign === 'top' && '-translate-y-3',
          vAlign === 'bottom' && '-translate-y-[calc(100%-0.75rem)]',
        )}
      >
        <div
          data-hotspot-card
          data-side={side}
          className={cn(
            'rounded-md border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] p-3 backdrop-blur-md',
            'shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]',
            side === 'right'
              ? 'border-l-[1.5px] border-l-[var(--color-highlight-bright)]'
              : 'border-r-[1.5px] border-r-[var(--color-highlight-bright)]',
          )}
        >
          <div className="flex items-start gap-3">
            {hotspot.bubbleUrl ? (
              <img
                src={hotspot.bubbleUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg border border-[var(--color-line)] object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <div className="min-w-0">
              <p className="anvl-display text-[0.6rem] uppercase leading-[1.35] tracking-[0.22em] text-[var(--color-highlight-bright)]">
                {hotspot.label}
              </p>
              <p className="mt-1.5 text-[0.74rem] leading-[1.5] text-[var(--color-text-muted)]">
                {hotspot.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Product stage + measured, accurately-anchored callout layer. */
function AnnotatedStage({
  item,
}: {
  item: OathResolvedContent['tenets']['items'][number]
}) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const rect = useContainedMediaRect(stageRef)

  return (
    <div ref={stageRef} className="relative mx-auto h-[78%] w-full max-w-2xl">
      <OathProductViewer
        modelUrl={item.modelUrl}
        mediaUrl={item.mediaUrl}
        tone={item.tone}
        alt={item.title}
      />
      {item.hotspots.map((hotspot) => (
        <Hotspot key={hotspot.id} hotspot={hotspot} rect={rect} />
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
