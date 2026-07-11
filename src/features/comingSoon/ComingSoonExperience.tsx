import { useMemo, type CSSProperties } from 'react'
import type { ComingSoonConfig } from '@/features/cms/comingSoon/comingSoon.zod'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { AnvlCrest } from '@/shared/assets/brand/AnvlCrest'
import { AnvlWordmark } from '@/shared/assets/brand/AnvlWordmark'
import { resolveComingSoonContent } from './content/resolveComingSoonContent'
import { useComingSoonEntrance } from './hooks/useComingSoonEntrance'
import { ComingSoonEnvironment } from './components/ComingSoonEnvironment'
import { ComingSoonStage } from './components/ComingSoonStage'
import { ComingSoonCountdown } from './components/ComingSoonCountdown'
import { ComingSoonEmailCapture } from './components/ComingSoonEmailCapture'
import { ComingSoonSocials } from './components/ComingSoonSocials'

/**
 * Page-scoped accent: `champagne` is the Drop 01 reveal treatment (forged
 * gold); `oath` defers to the published theme accent. Scoped to
 * `--cs-accent` — the global 15-token palette is untouched.
 */
const ACCENT_BY_VARIANT: Record<ComingSoonConfig['themeVariant'], string> = {
  champagne: '#C8A96A',
  oath: 'var(--color-accent)',
}

/** Concrete accent for WebGL (shaders can't read `var()` indirection). */
function accentHexFor(variant: ComingSoonConfig['themeVariant']): string {
  if (variant === 'champagne') return '#C8A96A'
  if (typeof window === 'undefined') return '#C8A96A'
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-accent')
    .trim()
  return raw || '#C8A96A'
}

/**
 * The pre-launch reveal — one non-scrolling screen, centered, visually
 * independent from the storefront (only the theme's colors and the brand
 * fonts carry over). An anvil forged from live WebGL embers burns behind the
 * type; the cursor stirs it and any click on open space hammer-strikes it.
 * Rendered in place of the entire public site while `coming_soon.enabled` is
 * on (see the gate in `src/routes/__root.tsx`). Fully CMS-driven with
 * designed defaults.
 */
export function ComingSoonExperience({
  config,
  mediaIndex,
}: {
  config: ComingSoonConfig
  mediaIndex: MediaIndexEntry[]
}) {
  const content = useMemo(
    () => resolveComingSoonContent(config, mediaIndex),
    [config, mediaIndex],
  )
  const scopeRef = useComingSoonEntrance()

  const accentStyle = {
    '--cs-accent': ACCENT_BY_VARIANT[content.themeVariant],
  } as CSSProperties
  const accentHex = useMemo(
    () => accentHexFor(content.themeVariant),
    [content.themeVariant],
  )

  return (
    <div
      ref={scopeRef}
      style={accentStyle}
      className="fixed inset-0 z-[80] overflow-hidden bg-[var(--color-bg)] text-[color:var(--color-text)]"
    >
      <ComingSoonEnvironment
        backgroundUrl={content.backgroundUrl}
        ambientUrl={content.ambientUrl}
      />

      {/* The living forge. Keeps pointer events: clicks on open space strike it. */}
      <ComingSoonStage accent={accentHex} />

      {/* Legibility shield — a soft dark band hugging ONLY the text column
          (not the whole center), so the oversized anvil's shoulders spill
          past it at full ember brightness while the copy stays on darkness.
          Pointer-transparent: strikes still pass through to the canvas. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] [background:radial-gradient(42%_58%_at_50%_46%,color-mix(in_oklab,var(--color-bg)_74%,transparent)_0%,color-mix(in_oklab,var(--color-bg)_48%,transparent)_52%,transparent_78%)]"
      />

      {/* Content column — pointer-transparent so the forge stays strikable;
          interactive islands (email, socials) re-enable their own events. */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col items-center px-6 pt-[max(env(safe-area-inset-top),1rem)]">
        <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-[clamp(0.55rem,2.1vh,1.6rem)] text-center">
          <div data-cs-reveal="crest" className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-5 rounded-full opacity-60 blur-2xl [background:radial-gradient(circle,color-mix(in_oklab,var(--cs-accent)_28%,transparent),transparent_70%)]"
            />
            {content.logoVariant === 'custom' && content.logoUrl ? (
              <img
                src={content.logoUrl}
                alt="ANVL Athletics"
                width={200}
                height={200}
                decoding="async"
                className="relative h-12 w-auto max-w-[200px] object-contain sm:h-14"
              />
            ) : content.logoVariant === 'wordmark' ? (
              <AnvlWordmark
                aria-label="ANVL Athletics"
                className="relative h-[clamp(1.4rem,3.4vh,2.25rem)] w-auto text-[color:var(--color-text)]"
              />
            ) : (
              <AnvlCrest
                aria-label="ANVL Athletics"
                className="relative h-[clamp(2.6rem,7vh,4.5rem)] w-auto text-[color:var(--color-text)]"
              />
            )}
          </div>

          <div className="flex w-full items-center justify-center gap-4">
            <span
              data-cs-rule
              aria-hidden="true"
              className="h-px w-10 origin-right bg-[linear-gradient(to_left,color-mix(in_oklab,var(--cs-accent)_65%,transparent),transparent)] sm:w-20"
            />
            <p
              data-cs-reveal="eyebrow"
              className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.5em] text-[color:color-mix(in_oklab,var(--cs-accent)_82%,white)] [text-shadow:0_1px_10px_rgba(0,0,0,0.9)] sm:text-xs"
            >
              {content.eyebrow}
            </p>
            <span
              data-cs-rule
              aria-hidden="true"
              className="h-px w-10 origin-left bg-[linear-gradient(to_right,color-mix(in_oklab,var(--cs-accent)_65%,transparent),transparent)] sm:w-20"
            />
          </div>

          <h1
            data-cs-headline
            className="max-w-[16ch] font-[family-name:var(--font-heading)] text-[clamp(1.9rem,min(8vw,8.2vh),5.5rem)] uppercase leading-[0.96] tracking-[0.01em] [perspective:600px] [filter:drop-shadow(0_3px_18px_rgba(0,0,0,0.85))]"
          >
            <span className="bg-[linear-gradient(180deg,var(--color-text)_45%,color-mix(in_oklab,var(--cs-accent)_60%,var(--color-text))_100%)] bg-clip-text text-transparent">
              {content.headline}
            </span>
          </h1>

          <p
            data-cs-reveal="subheadline"
            className="max-w-xl text-[clamp(0.8rem,1.9vh,1.05rem)] text-[color:color-mix(in_oklab,var(--color-text)_88%,transparent)] [text-shadow:0_1px_14px_rgba(0,0,0,0.9)]"
          >
            {content.subheadline}
          </p>

          <p
            data-cs-reveal="body"
            className="hidden max-w-xl text-sm leading-relaxed text-[color:color-mix(in_oklab,var(--color-text)_70%,transparent)] [text-shadow:0_1px_12px_rgba(0,0,0,0.9)] lg:[@media(min-height:760px)]:block"
          >
            {content.body}
          </p>

          <ComingSoonCountdown countdown={content.countdown} />
          <ComingSoonEmailCapture emailCapture={content.emailCapture} />
          <ComingSoonSocials socials={content.socials} />
        </main>

        <footer className="flex flex-col items-center gap-1.5 pb-[max(env(safe-area-inset-bottom),1.1rem)]">
          <p
            data-cs-reveal="hint"
            className="hidden text-[9px] uppercase tracking-[0.4em] text-[color:color-mix(in_oklab,var(--color-text)_52%,transparent)] [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:block"
          >
            Click anywhere — strike the forge
          </p>
          <p
            data-cs-reveal="tagline"
            className="text-[10px] font-semibold uppercase tracking-[0.5em] text-[color:color-mix(in_oklab,var(--cs-accent)_75%,white)] [text-shadow:0_1px_10px_rgba(0,0,0,0.9)] sm:text-[11px]"
          >
            {content.tagline}
          </p>
        </footer>
      </div>
    </div>
  )
}
