import { useEffect, useRef } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Full-page parallax backdrop. Fixed behind the page content with a
 * legibility wash so text stays readable. Subtle scroll parallax on desktop
 * (no-reduced-motion); static otherwise. SSR-safe.
 *
 * `intensity="vivid"` lightens the wash so the image reads clearly instead of
 * as a barely-there texture — for pages (e.g. Story's candlelit hall) whose
 * own gradients already carry most of the legibility work, so the default
 * wash was drowning the assigned photo.
 */
export function PageBackdrop({
  src,
  intensity = 'default',
}: {
  src: string
  intensity?: 'default' | 'vivid'
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const vivid = intensity === 'vivid'

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
        className={cn('absolute inset-[-8%] scale-110 bg-cover bg-center will-change-transform', vivid ? 'opacity-100' : 'opacity-90')}
        style={{ backgroundImage: `url('${src}')` }}
      />
      {/* Legibility wash — keeps content readable while the texture stays felt.
          Vivid pages carry a much lighter wash so the photo actually reads. */}
      <div
        className="absolute inset-0"
        style={{
          background: vivid
            ? 'color-mix(in oklab, var(--color-bg) 38%, transparent)'
            : 'color-mix(in oklab, var(--color-bg) 78%, transparent)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: vivid
            ? 'linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 42%, transparent), transparent 32%, transparent 68%, var(--color-bg))'
            : 'linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 60%, transparent), transparent, var(--color-bg))',
        }}
      />
    </div>
  )
}
