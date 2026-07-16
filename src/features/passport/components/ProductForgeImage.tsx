import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { cn } from '@/shared/lib/cn'

const ProductForgeCanvas = lazy(() => import('./ProductForgeCanvas'))

// Layout effect on the client (decide before paint → no flash), plain effect on
// the server (React skips it, and no useLayoutEffect SSR warning).
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * The passport's product render, forged from embers on FIRST LOAD only. On a
 * capable device the piece assembles out of particles and the crisp image
 * fades in as they dissolve; the canvas then unmounts, so there's no ongoing
 * GPU cost and section navigation never replays it. Reduced motion or no WebGL
 * shows the image straight away.
 *
 * SSR-safe: the initial render (server + first client paint) shows the image,
 * and a layout effect decides — before paint — whether to hide it and forge, so
 * there's no flash and no hydration mismatch.
 */
export function ProductForgeImage({
  src,
  alt,
  imgClassName,
  children,
}: {
  src: string
  alt: string
  imgClassName?: string
  children?: ReactNode
}) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<'shown' | 'forging' | 'revealing'>('shown')
  const decided = useRef(false)

  useIsoLayoutEffect(() => {
    if (decided.current) return
    decided.current = true
    if (!reduced && isWebglAvailable()) setPhase('forging')
  }, [reduced])

  const forging = phase === 'forging'
  const canvasMounted = phase === 'forging' || phase === 'revealing'

  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        width={1200}
        height={1500}
        decoding="async"
        className={cn(
          imgClassName,
          'motion-safe:transition-opacity motion-safe:duration-500',
        )}
        style={{ opacity: forging ? 0 : 1 }}
      />
      {canvasMounted ? (
        <Suspense fallback={null}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <ProductForgeCanvas
              src={src}
              onReveal={() => setPhase('revealing')}
              onComplete={() => setPhase('shown')}
            />
          </div>
        </Suspense>
      ) : null}
      {children}
    </div>
  )
}
