import { oathAsset, OATH_LOGO_PLACEHOLDER } from '../theOathAssets'

/**
 * Entry moment — the Drop 01 mark resolves with a thin progress line, then the
 * veil lifts to the hero. Pure CSS (`.anvl-preloader*`): renders in SSR markup
 * with no hydration state, `pointer-events-none` (never traps the page),
 * auto-dismisses, and collapses instantly under `prefers-reduced-motion`.
 */
export function LandingPreloader() {
  const logo = oathAsset('dropLogo') ?? OATH_LOGO_PLACEHOLDER
  return (
    <div
      aria-hidden="true"
      className="anvl-preloader pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-[var(--color-bg)]"
    >
      <div className="anvl-preloader-rise flex flex-col items-center">
        <img
          src={logo}
          alt=""
          width={96}
          height={96}
          className="h-20 w-auto opacity-90"
          style={{ filter: 'drop-shadow(0 0 22px rgba(199,194,184,0.3))' }}
        />
        <p className="anvl-micro mt-6 text-[var(--color-accent)]">
          Drop 01 — The Oath
        </p>
      </div>
      <span className="anvl-preloader-bar absolute bottom-[18%] h-px w-40 bg-[var(--color-accent)] opacity-80" />
    </div>
  )
}
