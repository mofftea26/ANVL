import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'

/**
 * Fade + subtle scale-in the first time the element scrolls into view.
 * Implemented with IntersectionObserver + a CSS transition (no animation
 * library) — this is the whole reason framer-motion is no longer a dependency.
 * Honors reduced-motion by rendering visible with no transition.
 */
export function RevealOnScroll({ children }: PropsWithChildren) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (reduced) {
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'scale(0.98)',
        transition: reduced ? undefined : 'opacity 0.4s ease, transform 0.4s ease',
        willChange: shown ? undefined : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
