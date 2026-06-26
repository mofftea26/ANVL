import { Container } from '@/shared/components/ui/Container'
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
 * warrior-voiced title/subtitle, and up to four annotated points (a dot, a leader
 * line, and a card with the material/tech and an optional bubble image). The
 * horizontal-on-scroll mechanic and `tenets.items[]` content key are unchanged.
 */
function Hotspot({ hotspot }: { hotspot: OathResolvedHotspot }) {
  return (
    <div
      data-hotspot={hotspot.id}
      className="absolute z-20 -translate-x-1/2"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
    >
      {/* The point. */}
      <span
        data-hotspot-dot
        className="relative block h-2.5 w-2.5 rounded-full bg-[var(--color-highlight-bright)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-highlight)_28%,transparent)]"
      />
      {/* Leader line down to the card. */}
      <span
        data-hotspot-line
        aria-hidden="true"
        className="mx-auto block h-9 w-px origin-top bg-[var(--color-highlight)]"
      />
      {/* Callout card. */}
      <div
        data-hotspot-card
        className="w-56 -translate-x-1/2 rounded-md border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] p-3 backdrop-blur-sm"
      >
        <div className="flex items-start gap-2.5">
          {hotspot.bubbleUrl ? (
            <img
              src={hotspot.bubbleUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-[var(--color-line)] object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-11 w-11 shrink-0 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-elevated)]"
            />
          )}
          <div className="min-w-0">
            <p className="anvl-display text-[0.6rem] uppercase tracking-[0.22em] text-[var(--color-highlight-bright)]">
              {hotspot.label}
            </p>
            <p className="mt-1 text-[0.74rem] leading-snug text-[var(--color-text-muted)]">
              {hotspot.description}
            </p>
          </div>
        </div>
      </div>
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
        className="relative h-[var(--anvl-section-h)] overflow-hidden bg-[var(--color-bg)]"
      >
        <OathSceneSeam edges="top" />

        {/* Fixed section chrome while the panorama pans beneath. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-[min(17rem,21vw)]">
          <Container className="flex h-full max-w-none px-6 xl:px-8">
            <div className="flex h-full flex-col justify-between py-14 pr-8">
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
              {/* Smokey background. */}
              <div aria-hidden="true" className="absolute inset-0">
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

                  {/* Product stage + annotated hotspots. */}
                  <div className="relative mx-auto h-[78%] w-full max-w-2xl">
                    <OathProductViewer
                      modelUrl={item.modelUrl}
                      mediaUrl={item.mediaUrl}
                      tone={item.tone}
                      alt={item.title}
                    />
                    {item.hotspots.map((hotspot) => (
                      <Hotspot key={hotspot.id} hotspot={hotspot} />
                    ))}
                  </div>
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
