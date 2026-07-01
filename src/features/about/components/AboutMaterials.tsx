import { Container } from '@/shared/components/ui/Container'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { AboutMediaFallback } from './AboutMediaFallback'

/**
 * Scene 03 — The Forge, Part I: Materials. Not pinned — a normal scroll-through
 * parallax beat (`buildAboutMaterials`). Two fabric macro layers drift at
 * different rates while the step copy reveals once on enter.
 */
export function AboutMaterials({
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
      data-scene="materials"
      className="relative w-full overflow-hidden py-24 md:py-32"
      aria-labelledby="about-materials-heading"
    >
      <Container className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div data-materials-reveal className="order-2 md:order-1">
          <p className="anvl-display text-xs tracking-[0.3em] text-[var(--color-highlight-bright)]">
            {step.eyebrow}
          </p>
          <h2
            id="about-materials-heading"
            data-reveal-m
            className="anvl-heading mt-4 font-normal leading-[0.92] tracking-[-0.01em] text-[clamp(2rem,5vw,3.25rem)] text-[var(--color-heading)]"
          >
            {step.title}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]" data-reveal-m>
            {step.body}
          </p>
        </div>

        <div className="relative order-1 h-[26rem] md:order-2 md:h-[32rem]">
          <div className="absolute inset-0 overflow-hidden rounded-md border border-[var(--color-line)]">
            <AboutMediaFallback
              media={image1}
              className="scale-125"
              layerAttrs={{ 'data-materials-layer': '1' }}
            />
          </div>
          <div className="absolute -bottom-8 -right-4 h-40 w-32 overflow-hidden rounded-md border border-[var(--color-line)] shadow-2xl md:-bottom-10 md:-right-8 md:h-52 md:w-40">
            <AboutMediaFallback
              media={image2}
              className="scale-125"
              layerAttrs={{ 'data-materials-layer': '2' }}
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
