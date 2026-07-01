import { Container } from '@/shared/components/ui/Container'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { AboutMediaFallback } from './AboutMediaFallback'

/**
 * Scene 04 — The Forge, Part II: Construction. Not pinned. Two seam/stitch
 * macro layers parallax (`buildAboutConstruction`); annotated hotspot markers
 * stagger in once the scene enters view. Each marker is a focusable button so
 * the material callout reads for keyboard and screen-reader users, not just
 * on hover.
 */
export function AboutConstruction({
  step,
  image1,
  image2,
}: {
  step: AboutResolvedContent['process']['steps'][number]
  image1?: string
  image2?: string
}) {
  return (
    <section
      data-scene="construction"
      className="relative w-full overflow-hidden py-24 md:py-32"
      aria-labelledby="about-construction-heading"
    >
      <Container className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div className="relative h-[26rem] md:h-[32rem]">
          <div className="absolute inset-0 overflow-hidden rounded-md border border-[var(--color-line)]">
            <AboutMediaFallback
              media={image1}
              className="scale-125"
              layerAttrs={{ 'data-construction-layer': '1' }}
            />
            {step.hotspots.map((h) => (
              <button
                key={h.id}
                type="button"
                data-construction-hotspot
                className="focus-ring group absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-highlight-bright)] bg-[color-mix(in_srgb,var(--color-bg)_70%,transparent)] text-[var(--color-highlight-bright)] backdrop-blur-sm"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-left text-xs text-[var(--color-text-muted)] opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="anvl-display block text-[10px] tracking-[0.2em] text-[var(--color-highlight-bright)]">
                    {h.label}
                  </span>
                  <span className="mt-1 block">{h.description}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="absolute -bottom-8 -left-4 h-40 w-32 overflow-hidden rounded-md border border-[var(--color-line)] shadow-2xl md:-bottom-10 md:-left-8 md:h-52 md:w-40">
            <AboutMediaFallback
              media={image2}
              className="scale-125"
              layerAttrs={{ 'data-construction-layer': '2' }}
            />
          </div>
        </div>

        <div data-construction-reveal>
          <p className="anvl-display text-xs tracking-[0.3em] text-[var(--color-highlight-bright)]">
            {step.eyebrow}
          </p>
          <h2
            id="about-construction-heading"
            data-reveal-m
            className="anvl-heading mt-4 font-normal leading-[0.92] tracking-[-0.01em] text-[clamp(2rem,5vw,3.25rem)] text-[var(--color-heading)]"
          >
            {step.title}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]" data-reveal-m>
            {step.body}
          </p>
        </div>
      </Container>
    </section>
  )
}
