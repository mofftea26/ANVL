import { Container } from '@/shared/components/ui/Container'
import type { OathResolvedContent } from '../content/oathContent.defaults'
import { oathTenetMedia } from '../theOathAssets'
import { OathMediaFallback } from './OathMediaFallback'
import { OathSceneSeam } from './OathSceneSeam'

/** Horizontal edge fade so each panorama panel melts into the next at the seam. */
const TENET_EDGE_FEATHER =
  'linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)'

/**
 * Scene 03 — Four Tenets. Desktop/tablet: a pinned full-bleed panorama — the
 * four vows sit side by side as a horizontal strip that pans on scroll, each
 * image feathered on its left/right so it fades into the next at the seam.
 * Mobile/static: a 2-up portrait card grid. CMS media per tenet
 * (`chapterMedia1..4`); duotone placeholder when unassigned.
 */
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
      className="relative w-full"
    >
      <h2 id="oath-tenets-heading" className="sr-only">
        {tenets.eyebrow}
      </h2>

      <OathSceneSeam />

      {/* Desktop/tablet: pinned full-bleed panorama. */}
      <div
        data-tenet-stage
        className="relative hidden h-[var(--anvl-section-h)] overflow-hidden md:block"
      >
        <div data-tenet-track className="flex h-full w-full will-change-transform">
          {items.map((tenet, i) => (
            <article
              key={tenet.id}
              data-tenet={tenet.id}
              className="relative h-full w-full shrink-0 overflow-hidden"
              aria-label={`${tenet.index} — ${tenet.title}`}
            >
              <div
                className="absolute inset-0"
                style={{
                  maskImage: TENET_EDGE_FEATHER,
                  WebkitMaskImage: TENET_EDGE_FEATHER,
                }}
              >
                <OathMediaFallback
                  media={oathTenetMedia(i + 1)}
                  tone={tenet.tone}
                  grain
                  vignette={false}
                  mediaAttrs={{ 'data-tenet-media': tenet.id }}
                />
              </div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/2"
                style={{
                  background:
                    'linear-gradient(to top, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 70%, transparent) 45%, transparent 100%)',
                }}
              />

              <div className="absolute inset-x-0 bottom-0 z-10 flex items-end pb-20">
                <Container>
                  <div className="max-w-xl">
                    <p className="anvl-display flex items-center gap-2.5 text-[0.62rem] tracking-[0.34em] text-[var(--color-highlight-bright)]">
                      <span className="tabular-nums text-[var(--color-heading)]/85">
                        {tenet.index}
                      </span>
                      <span
                        className="h-px w-10 bg-[var(--color-highlight-bright)]"
                        aria-hidden="true"
                      />
                      {tenet.marker}
                    </p>
                    <h3 className="anvl-heading mt-3 font-normal leading-[0.92] tracking-[-0.01em] text-[clamp(1.85rem,4.6vw,3.75rem)] text-[var(--color-heading)]">
                      {tenet.title}
                    </h3>
                    <p className="mt-3 max-w-md text-[0.82rem] leading-relaxed text-[var(--color-text-muted)] sm:text-sm">
                      {tenet.line}
                    </p>
                  </div>
                </Container>
              </div>
            </article>
          ))}
        </div>

        <Container className="pointer-events-none absolute inset-x-0 top-[13%] z-20">
          <p className="anvl-display flex items-center gap-3 text-[0.7rem] tracking-[0.34em] text-[var(--color-heading)]/85">
            <span className="h-px w-10 bg-[var(--color-highlight-bright)]" aria-hidden="true" />
            {tenets.eyebrow}
          </p>
        </Container>
      </div>

      {/* Mobile/static: tenet cards. */}
      <div className="md:hidden">
        <Container className="py-16">
          <p
            className="anvl-display text-[0.65rem] tracking-[0.34em] text-[var(--color-heading)]/85"
            data-reveal-m
          >
            {tenets.eyebrow}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 min-[430px]:grid-cols-2">
            {items.map((tenet, i) => (
              <article
                key={tenet.id}
                data-reveal-m
                className="relative overflow-hidden rounded-lg border border-[var(--color-line)]"
                aria-label={`${tenet.index} — ${tenet.title}`}
              >
                <div className="relative aspect-[4/5.3]">
                  <OathMediaFallback media={oathTenetMedia(i + 1)} tone={tenet.tone} vignette />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
                    <p className="anvl-display text-[9px] tracking-[0.3em] text-[var(--color-heading)]/85">
                      {tenet.index} · {tenet.marker}
                    </p>
                    <h3 className="anvl-heading mt-1.5 text-lg font-normal leading-[0.95]">
                      {tenet.title}
                    </h3>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </div>
    </section>
  )
}
