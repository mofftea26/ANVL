import type { OmResolvedContent } from '../content/oathModernContent.defaults'
import type { Product } from '@/features/products/types/product.types'
import { OmCtaLink, OmEyebrow, OmHeading } from './OmPrimitives'

/**
 * Chapter I — Threshold. The entrance: the staged hero object emerging from the
 * forged dark, the campaign vow, and the single primary call to action.
 *
 * SSR-first and self-sufficient. On desktop the persistent WebGL canvas (M3)
 * renders the orbiting object *behind* this DOM via `[data-om-webgl="on"]`, which
 * hides the static plate; here it stands alone for first paint, mobile,
 * reduced-motion, and no-WebGL.
 */
export function OmThreshold({
  content,
  heroProduct,
  heroProductPng,
  heroBackground,
}: {
  content: OmResolvedContent
  heroProduct: Product | undefined
  heroProductPng: string | null
  heroBackground: string | null
}) {
  const t = content.threshold
  const staged = heroProductPng ?? heroProduct?.images[0]?.src ?? null

  return (
    <section
      id="threshold"
      data-om-chapter="threshold"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden px-6 pb-24 pt-[calc(var(--anvl-header-h)+4rem)] lg:px-12"
    >
      {/* Static forged backdrop — hidden when the WebGL altar is live. */}
      <div
        aria-hidden="true"
        data-om-static-stage
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {heroBackground ? (
          <img
            src={heroBackground}
            alt=""
            className="h-full w-full object-cover opacity-60"
            loading="eager"
            decoding="async"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 72% 28%, color-mix(in srgb, var(--hero-glow) 36%, transparent) 0%, var(--color-bg) 62%)',
          }}
        />
      </div>

      <div className="mx-auto grid w-full max-w-[var(--anvl-content-max)] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-xl">
          <OmEyebrow>{t.eyebrow}</OmEyebrow>
          <OmHeading
            as="h1"
            text={t.heading}
            highlight={t.highlightWords}
            className="mt-6 text-5xl sm:text-6xl lg:text-7xl"
          />
          <p
            data-om-reveal
            className="mt-7 max-w-md text-pretty text-[0.98rem] leading-relaxed text-[color:var(--color-text-muted)]"
          >
            {t.body}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <OmCtaLink href={t.primaryCta.href} tone="primary" data-om-magnetic>
              {t.primaryCta.label}
            </OmCtaLink>
            <OmCtaLink href={t.secondaryCta.href} tone="ghost">
              {t.secondaryCta.label}
            </OmCtaLink>
          </div>
        </div>

        {/* Staged product plate (static tier). */}
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm" data-om-static-stage>
          {staged ? (
            <img
              src={staged}
              alt={heroProduct?.name ?? 'Drop 01 piece'}
              className="h-full w-full object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full rounded-sm border border-[var(--color-line)]"
              style={{
                background:
                  'linear-gradient(160deg, color-mix(in srgb, var(--color-surface-elevated) 80%, transparent), var(--color-bg))',
              }}
            />
          )}
        </div>
      </div>

      <span
        aria-hidden="true"
        className="anvl-micro absolute bottom-8 left-6 text-[0.62rem] uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] lg:left-12"
      >
        {t.scrollPrompt}
      </span>
    </section>
  )
}
