import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/shared/lib/gsap'
import { OATH_FINE_POINTER_DESKTOP_MQ } from '../oathBreakpoints'

/**
 * Page-scoped custom cursor: a bone dot with a lagging ring, blending with the
 * scene via `mix-blend-difference`. States come from `data-cursor` attributes
 * (`cta` | `view`) by event delegation. Tracking + the native-cursor hide are
 * **window/page-wide** (not scoped to the landing root) so the custom cursor
 * persists over the fixed top bar too — this component only mounts on the
 * landing page (fine-pointer desktop, no reduced motion), so going page-wide is
 * safe; touch and static branches never see it.
 */
export function OathCursor() {
  const [enabled, setEnabled] = useState(false)
  const dotRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fine = window.matchMedia(OATH_FINE_POINTER_DESKTOP_MQ)
    const update = () => setEnabled(fine.matches)
    update()
    fine.addEventListener('change', update)
    return () => fine.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.38, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.38, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2, overwrite: 'auto' })
    }
    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('[data-cursor]')
      const state = target?.getAttribute('data-cursor')
      gsap.to(ring, {
        scale: state ? 1.35 : 1,
        duration: 0.3,
        ease: 'power3.out',
        overwrite: 'auto',
      })
      gsap.to(dot, {
        scale: state === 'cta' ? 0.5 : 1,
        duration: 0.3,
        overwrite: 'auto',
      })
    }
    const onLeave = () => {
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25, overwrite: 'auto' })
    }

    // Window-wide so the custom cursor keeps tracking over the fixed top bar
    // (which lives outside the landing root). Fades out only when the pointer
    // leaves the document entirely.
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80]">
      {/* Hide the native pointer page-wide while the custom cursor is active —
          including the fixed top bar and any interactive element whose own
          `cursor: pointer` would otherwise win. Only rendered on the landing
          page's fine-pointer desktop branch, so touch / reduced-motion / other
          routes keep the native cursor. */}
      <style>{`html,body,body *,body *::before,body *::after{cursor:none !important}`}</style>
      {/* GSAP owns the transform (x/y) — centering comes from negative margins. */}
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-10 w-10 rounded-full border border-[var(--anvl-bone,#E7E4DF)] opacity-0 mix-blend-difference will-change-transform"
        style={{ marginLeft: '-20px', marginTop: '-20px' }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-[var(--anvl-bone,#E7E4DF)] opacity-0 mix-blend-difference will-change-transform"
        style={{ marginLeft: '-3px', marginTop: '-3px' }}
      />
    </div>
  )
}
