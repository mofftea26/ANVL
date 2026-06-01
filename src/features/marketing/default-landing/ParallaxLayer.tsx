import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type ParallaxLayerProps = {
  /** Depth multiplier for scroll/mouse parallax (0–1). */
  depth?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
  /** Optional data attribute for GSAP targeting. */
  dataBrand?: string
  'aria-hidden'?: boolean
}

/**
 * GPU-friendly layer wrapper — used for ambient emblems, fog, and depth planes.
 */
export function ParallaxLayer({
  depth = 0.5,
  className,
  style,
  children,
  dataBrand,
  'aria-hidden': ariaHidden = true,
}: ParallaxLayerProps) {
  return (
    <div
      data-brand-depth={depth}
      data-brand-ambient={dataBrand !== undefined ? dataBrand : undefined}
      className={cn('will-change-[transform,opacity,filter]', className)}
      style={style}
      aria-hidden={ariaHidden}
    >
      {children}
    </div>
  )
}

export type AmbientEmblemLayer = {
  src: string
  left: string
  top: string
  width: string
  depth: number
  opacity: number
  rotate: number
  /** When true, emblem is anchored from horizontal center (translateX(-50%)). */
  centerX?: boolean
}

export function AmbientEmblemField({ layers }: { layers: readonly AmbientEmblemLayer[] }) {
  return (
    <>
      {layers.map((layer, i) => (
        <ParallaxLayer
          key={`ambient-${i}`}
          depth={layer.depth}
          dataBrand=""
          className="absolute select-none"
          style={{
            left: layer.left,
            top: layer.top,
            width: layer.width,
            opacity: layer.opacity,
            transform: `${layer.centerX ? 'translateX(-50%) ' : ''}rotate(${layer.rotate}deg)`,
          }}
        >
          <img src={layer.src} alt="" className="size-full object-contain" />
        </ParallaxLayer>
      ))}
    </>
  )
}
