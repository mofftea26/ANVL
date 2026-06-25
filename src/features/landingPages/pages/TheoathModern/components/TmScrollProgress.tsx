import { useEffect, useRef } from 'react'

/**
 * Slim champagne scroll-progress rail pinned to the top of the viewport, scoped
 * to the Theoath Modern landing. Transform-only (scaleX), passive scroll +
 * rAF-throttled — no layout reads in the handler.
 */
export function TmScrollProgress() {
  const fill = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const el = fill.current
      if (!el) return
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const p = max > 0 ? doc.scrollTop / max : 0
      el.style.transform = `scaleX(${p.toFixed(4)})`
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-[color-mix(in_srgb,var(--color-line)_60%,transparent)]"
    >
      <div
        ref={fill}
        className="h-full origin-left scale-x-0 bg-[var(--color-highlight)]"
      />
    </div>
  )
}
