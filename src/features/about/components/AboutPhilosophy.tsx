import { Container } from '@/shared/components/ui/Container'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { AboutMediaFallback } from './AboutMediaFallback'

/**
 * Scene 02 — The Philosophy ("Pressure. Repetition. Discipline."). Pinned on
 * desktop: each line reveals word-by-word as scroll scrubs (`buildAboutPhilosophy`);
 * the monolith recedes/darkens behind it. Static branch reveals the block whole.
 */
export function AboutPhilosophy({ philosophy }: { philosophy: AboutResolvedContent['philosophy'] }) {
  return (
    <section
      data-scene="philosophy"
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden py-24"
      aria-labelledby="about-philosophy-heading"
    >
      <AboutMediaFallback
        vignette={false}
        className="-z-20 opacity-70"
        layerAttrs={{ 'data-philosophy-media': '1' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 50%, transparent 0%, var(--color-bg) 85%)' }}
      />

      <Container className="relative z-10 max-w-3xl text-center">
        <h2 id="about-philosophy-heading" className="sr-only">
          {philosophy.eyebrow}
        </h2>
        <p
          data-philosophy-eyebrow
          data-reveal-m
          className="anvl-display text-xs tracking-[0.34em] text-[var(--color-highlight-bright)]"
        >
          {philosophy.eyebrow}
        </p>
        <div className="mt-8 space-y-3">
          {philosophy.lines.map((line, i) => (
            <p
              key={`${i}-${line}`}
              data-philosophy-line
              data-reveal-m
              className="anvl-heading font-normal leading-[1.05] tracking-[-0.01em] text-[clamp(1.75rem,5.5vw,3.25rem)] text-[var(--color-heading)]"
            >
              {line}
            </p>
          ))}
        </div>
      </Container>
    </section>
  )
}
