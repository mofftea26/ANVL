import { Suspense, lazy, useEffect, useState } from 'react'
import { isWebglAvailable } from '@/features/story/lib/webgl'
import { OATH_DESKTOP_CINEMATIC_MQ } from '../oathBreakpoints'

const OathProductCanvas = lazy(() => import('../webgl/OathProductCanvas'))

/**
 * Product stage for one Arsenal slide. Shows the assigned product GLB
 * (`modelUrl`) in a lazy WebGL viewer on desktop + WebGL + no-reduced-motion;
 * otherwise an intentional product plate — the assigned still (`mediaUrl`) or a
 * forged duotone plinth. The annotation hotspots overlay this stage in the parent.
 */
export function OathProductViewer({
  modelUrl,
  mediaUrl,
  tone,
  alt,
}: {
  modelUrl?: string
  mediaUrl?: string
  tone: string
  alt: string
}) {
  const [canRender3d, setCanRender3d] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(OATH_DESKTOP_CINEMATIC_MQ)
    const update = () => setCanRender3d(media.matches && isWebglAvailable())
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  if (modelUrl && canRender3d) {
    return (
      <div className="absolute inset-0" data-tenet-media>
        <Suspense fallback={null}>
          <OathProductCanvas modelUrl={modelUrl} />
        </Suspense>
      </div>
    )
  }

  if (mediaUrl) {
    return (
      <img
        src={mediaUrl}
        alt={alt}
        data-tenet-media
        className="absolute inset-0 h-full w-full object-contain"
        loading="lazy"
        decoding="async"
      />
    )
  }

  // Forged ember glow — intentional placeholder until a GLB/still is assigned.
  // Fades fully to transparent (not to --color-bg) so it reads as a soft light on
  // the smokey slide, never a rectangular box/panel filling the stage.
  return (
    <div
      data-tenet-media
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background: `radial-gradient(56% 56% at 50% 46%, ${tone} 0%, color-mix(in srgb, ${tone} 28%, transparent) 44%, transparent 72%)`,
      }}
    />
  )
}
