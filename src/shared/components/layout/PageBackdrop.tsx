import { useEffect, useRef } from 'react'

/**
 * Full-page parallax backdrop. Fixed behind the page content with a legibility
 * wash so text stays readable. Subtle scroll parallax on desktop (no-reduced-
 * motion); static otherwise. SSR-safe.
 */
export function PageBackdrop({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)')
    if (!mq.matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transform = `translate3d(0, ${window.scrollY * 0.12}px, 0)`
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [src])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        ref={ref}
        className="absolute inset-[-8%] scale-110 bg-cover bg-center opacity-90 will-change-transform"
        style={{ backgroundImage: `url('${src}')` }}
      />
      {/* Legibility wash — keeps content readable while the texture stays felt. */}
      <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-bg)_78%,transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/60 via-transparent to-[var(--color-bg)]" />
    </div>
  )
}
