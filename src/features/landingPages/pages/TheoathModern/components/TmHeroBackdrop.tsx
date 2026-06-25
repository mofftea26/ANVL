import { useEffect, useRef } from 'react'

/**
 * Cinematic hero backdrop — the static lab still with continuous, seamless
 * motion: scroll parallax (transform-only), a slow Ken Burns drift, and a
 * champagne light-sweep that travels off-screen so it never visibly restarts.
 * (The looping video read as "restarting" at its seam, so the living motion now
 * comes from this seamless CSS layer plus the persistent WebGL scene; the
 * `heroBackgroundVideo` CMS slot remains available.) The still is always the
 * LCP/first-paint frame, so there is no flash. Reduced motion freezes it.
 */
export function TmHeroBackdrop({ image }: { image: string | null }) {
  const layerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = layerRef.current
    if (!el || typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      const y = Math.min(window.scrollY, 1400)
      el.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (!image) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        <img
          src={image}
          alt=""
          className="tm-kenburns h-full w-full scale-105 object-cover opacity-40"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Continuous champagne light-sweep (travels off-screen — no visible seam). */}
      <div className="tm-lightsweep absolute inset-0" />

      {/* Legibility scrim — darkest on the left where the headline sits. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 68%, transparent) 46%, transparent 100%), linear-gradient(to top, var(--color-bg), transparent 60%)',
        }}
      />
    </div>
  )
}
