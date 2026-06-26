import { Container } from '@/shared/components/ui/Container'
import type { OathResolvedContent } from '../content/oathContent.defaults'
import { oathTenetMediaFromUrl } from '../theOathAssets'
import { OathMediaFallback } from './OathMediaFallback'
import { OathSceneSeam } from './OathSceneSeam'

/**
 * Crossfade mask — panels never hit fully transparent at the seam so adjacent
 * vows dissolve into each other instead of leaving a void band between blocks.
 */
const TENET_PANEL_MASK =
  'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 7%, rgba(0,0,0,0.92) 16%, #000 24%, #000 76%, rgba(0,0,0,0.92) 84%, rgba(0,0,0,0.35) 93%, rgba(0,0,0,0) 100%)'

/**
 * Scene 03 — Product Characteristics. Desktop only (hidden below xl): a pinned
 * full-bleed panorama that showcases the Drop 01 piece one trait at a time — each
 * characteristic pans horizontally into view and presents itself (caption rises,
 * media settles), the feathered seams melting one into the next. CMS media per
 * characteristic (`tenets.items[].mediaId`); duotone placeholder when unassigned.
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
      className="relative hidden w-full xl:block"
    >
      <h2 id="oath-tenets-heading" className="sr-only">
        {tenets.eyebrow}
      </h2>

      <div
        data-tenet-stage
        className="relative h-[var(--anvl-section-h)] overflow-hidden bg-[var(--color-bg)]"
      >
        {/* Creed→vows top feather — pairs with manifesto bottom seam on solid stage bg. */}
        <OathSceneSeam edges="top" />

        {/* Section chrome — fixed while the panorama pans beneath */}
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
                {items.length.toString().padStart(2, '0')} traits · scroll
              </p>
            </div>
          </Container>
        </div>

        <div data-tenet-track className="flex h-full w-full will-change-transform">
          {items.map((tenet) => (
            <article
              key={tenet.id}
              data-tenet={tenet.id}
              className="relative h-full w-full shrink-0 overflow-hidden"
              aria-label={`${tenet.index} — ${tenet.title}`}
            >
              <div
                className="absolute inset-0"
                style={{
                  maskImage: TENET_PANEL_MASK,
                  WebkitMaskImage: TENET_PANEL_MASK,
                }}
              >
                <OathMediaFallback
                  media={oathTenetMediaFromUrl(tenet.mediaUrl)}
                  tone={tenet.tone}
                  grain
                  vignette={false}
                  mediaAttrs={{ 'data-tenet-media': tenet.id }}
                />
              </div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                  background:
                    'linear-gradient(105deg, color-mix(in srgb, var(--color-bg) 88%, transparent) 0%, color-mix(in srgb, var(--color-bg) 42%, transparent) 28%, transparent 52%)',
                }}
              />

              <div className="absolute inset-0 z-10 flex items-center">
                <Container className="w-full">
                  <div className="grid grid-cols-[min(17rem,21vw)_1fr] items-end gap-x-10">
                    <div aria-hidden="true" className="select-none">
                      <span
                        data-tenet-index
                        className="anvl-heading block font-normal tabular-nums leading-[0.82] tracking-[-0.04em] text-[var(--color-heading)]/12 text-[clamp(5.5rem,14vw,11rem)]"
                      >
                        {tenet.index}
                      </span>
                    </div>

                    <div className="max-w-2xl pb-6">
                      <p
                        data-tenet-marker
                        className="anvl-display text-[0.58rem] tracking-[0.36em] text-[var(--color-highlight-bright)]"
                      >
                        {tenet.marker}
                      </p>
                      <h3
                        data-tenet-title
                        className="anvl-heading mt-3 font-normal leading-[0.9] tracking-[-0.015em] text-[var(--color-heading)] text-[clamp(2.15rem,4.8vw,4.25rem)]"
                      >
                        {tenet.title}
                      </h3>
                      <p
                        data-tenet-line
                        className="mt-5 max-w-lg text-[0.9rem] leading-[1.65] text-[var(--color-text-muted)]"
                      >
                        {tenet.line}
                      </p>
                    </div>
                  </div>
                </Container>
              </div>
            </article>
          ))}
        </div>

        {/* Vows→products bottom feather on the pinned stage. */}
        <OathSceneSeam edges="bottom" />
      </div>
    </section>
  )
}
