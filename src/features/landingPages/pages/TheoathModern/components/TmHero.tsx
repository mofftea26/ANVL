import type { RefObject } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { TmResolvedContent } from '../content/theoathModernContent.defaults'
import { TmCtaLink } from './TmCtaLink'
import { TmIndexMarker } from './TmPrimitives'
import { TmProductStage } from './TmProductStage'
import { TmHeroBackdrop } from './TmHeroBackdrop'

/** Render a heading with selected words in the champagne highlight ink. */
function HighlightHeading({
  heading,
  highlightWords,
}: {
  heading: string
  highlightWords: string[]
}) {
  if (highlightWords.length === 0) return <>{heading}</>
  const set = new Set(highlightWords.map((w) => w.toLowerCase()))
  return (
    <>
      {heading.split(/(\s+)/).map((token, i) =>
        set.has(token.toLowerCase()) ? (
          <span key={i} className="text-[color:var(--color-highlight-bright)]">
            {token}
          </span>
        ) : (
          <span key={i}>{token}</span>
        ),
      )}
    </>
  )
}

export function TmHero({
  root,
  content,
  heroProduct,
  heroProductPng,
  heroBackground = null,
}: {
  root: RefObject<HTMLElement | null>
  content: TmResolvedContent
  heroProduct: Product | undefined
  heroProductPng: string | null
  heroBackground?: string | null
}) {
  const { hero } = content
  const alignCenter = hero.settings.layoutAlign === 'center'

  return (
    <section
      data-tm-section="hero"
      className="relative grid min-h-[calc(100svh-var(--anvl-header-h))] items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:px-12"
    >
      {/* Cinematic lab backdrop — seamless parallax + Ken Burns + light sweep. */}
      <TmHeroBackdrop image={heroBackground} />
      <div className={alignCenter ? 'relative z-10 mx-auto max-w-2xl text-center' : 'relative z-10 max-w-2xl'}>
        <p
          data-tm-hero-fade
          className="anvl-micro text-[0.7rem] uppercase tracking-[0.32em] text-[color:var(--color-text-muted)]"
        >
          {hero.eyebrow}
        </p>
        <h1
          data-tm-headline
          className="anvl-heading mt-5 text-5xl uppercase leading-[0.95] sm:text-6xl lg:text-7xl"
        >
          <HighlightHeading
            heading={hero.heading}
            highlightWords={hero.highlightWords}
          />
        </h1>
        <p
          data-tm-hero-fade
          className="mt-6 max-w-xl text-base leading-relaxed text-[color:var(--color-text-muted)] sm:text-lg"
        >
          {hero.description}
        </p>
        <div
          data-tm-hero-fade
          className={
            alignCenter
              ? 'mt-9 flex flex-wrap justify-center gap-3'
              : 'mt-9 flex flex-wrap gap-3'
          }
        >
          <TmCtaLink cta={hero.primaryCta} kind="primary" />
          <TmCtaLink cta={hero.secondaryCta} kind="secondary" />
        </div>
        <ul
          data-tm-hero-fade
          className={
            alignCenter
              ? 'mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2'
              : 'mt-12 flex flex-wrap gap-x-6 gap-y-2'
          }
        >
          {hero.sideIndex.map((label) => (
            <li key={label}>
              <TmIndexMarker>{label}</TmIndexMarker>
            </li>
          ))}
        </ul>
      </div>

      <TmProductStage
        root={root}
        content={content}
        heroProduct={heroProduct}
        heroProductPng={heroProductPng}
        hotspots={hero.hotspots}
      />

      {/* Mobile/tablet: hotspots as an accessible tappable list (no canvas-only info). */}
      {hero.hotspots.length > 0 ? (
        <ul className="relative z-10 grid gap-3 lg:hidden">
          {hero.hotspots.map((h) => (
            <li
              key={h.id}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                {h.label}
              </p>
              <p className="mt-1.5 text-sm text-[color:var(--color-text-muted)]">
                {h.line}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <p
        aria-hidden="true"
        className="anvl-micro absolute bottom-6 left-1/2 -translate-x-1/2 text-[0.62rem] uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]"
      >
        {hero.scrollPrompt}
      </p>
    </section>
  )
}
