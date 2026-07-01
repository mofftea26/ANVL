import { Container } from '@/shared/components/ui/Container'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { AboutMediaFallback } from './AboutMediaFallback'

function StatItem({ stat }: { stat: AboutResolvedContent['stats']['items'][number] }) {
  const numeric = Number(stat.value)
  const isNumeric = stat.value.trim().length > 0 && Number.isFinite(numeric)

  return (
    <div data-stat-item className="border-l border-[var(--color-line)] pl-4">
      <p className="anvl-heading font-normal leading-none text-[clamp(2rem,4.5vw,3rem)] text-[var(--color-heading)]">
        {isNumeric ? (
          <>
            <span data-stat-value data-stat-target={numeric}>
              {stat.value}
            </span>
            {stat.suffix}
          </>
        ) : (
          <span data-stat-value>{stat.value}</span>
        )}
      </p>
      <p className="mt-2 text-xs leading-snug text-[var(--color-text-muted)]">{stat.label}</p>
    </div>
  )
}

/**
 * Scene 05 — The Forge, Part III: Testing + fun facts. Not pinned. The
 * testing backdrop parallaxes (`buildAboutTesting`); each numeric stat counts
 * up from zero once the scene enters view.
 */
export function AboutTesting({
  step,
  stats,
  testingImage,
}: {
  step: AboutResolvedContent['process']['steps'][number]
  stats: AboutResolvedContent['stats']
  testingImage?: string
}) {
  return (
    <section
      data-scene="testing"
      className="relative w-full overflow-hidden py-24 md:py-32"
      aria-labelledby="about-testing-heading"
    >
      <AboutMediaFallback media={testingImage} className="-z-20 opacity-60" layerAttrs={{ 'data-testing-layer': '1' }} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(180deg, var(--color-bg) 0%, transparent 30%, transparent 70%, var(--color-bg) 100%)' }}
      />

      <Container className="relative z-10">
        <div data-testing-reveal className="max-w-2xl">
          <p className="anvl-display text-xs tracking-[0.3em] text-[var(--color-highlight-bright)]">{step.eyebrow}</p>
          <h2
            id="about-testing-heading"
            data-reveal-m
            className="anvl-heading mt-4 font-normal leading-[0.92] tracking-[-0.01em] text-[clamp(2rem,5vw,3.25rem)] text-[var(--color-heading)]"
          >
            {step.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--color-text-muted)]" data-reveal-m>
            {step.body}
          </p>
        </div>

        <div className="mt-14">
          <p className="anvl-display text-xs tracking-[0.3em] text-[var(--color-highlight-bright)]" data-reveal-m>
            {stats.eyebrow}
          </p>
          <h3
            data-reveal-m
            className="anvl-heading mt-2 font-normal text-[clamp(1.5rem,3.5vw,2.25rem)] text-[var(--color-heading)]"
          >
            {stats.title}
          </h3>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {stats.items.map((stat) => (
              <StatItem key={stat.id} stat={stat} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
