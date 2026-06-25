import { useRef, type RefObject } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type {
  TmResolvedContent,
  TmResolvedHotspot,
} from '../content/theoathModernContent.defaults'
import { useTmMotionState } from '../motion/tmMotionState'
import { useTmStageParallax } from '../hooks/useTmStageParallax'
import { TmHotspot } from './TmHotspot'
import { TechForgeCanvasGate } from '../webgl/TechForgeCanvasGate'

/**
 * The hero stage: a procedural WebGL platform + dust (desktop, gated) sits behind
 * the real seamless-tee cutout, which leans toward the pointer in 2.5D with a
 * champagne rim, contact shadow, and idle float. Technical hotspots overlay as
 * accessible buttons. Falls back to a pure-CSS platform + static product on
 * mobile / reduced-motion / no-WebGL.
 */
export function TmProductStage({
  root,
  content,
  heroProduct,
  heroProductPng,
  hotspots,
}: {
  root: RefObject<HTMLElement | null>
  content: TmResolvedContent
  heroProduct: Product | undefined
  heroProductPng: string | null
  hotspots: TmResolvedHotspot[]
}) {
  const motion = useTmMotionState()
  const tiltRef = useRef<HTMLDivElement | null>(null)
  useTmStageParallax(tiltRef, motion)

  const image = heroProductPng || heroProduct?.images[0]?.src || null
  const alt =
    heroProduct?.images[0]?.alt ?? heroProduct?.name ?? 'ANVL compression shirt'
  const enable3d = content.hero.settings.enable3d

  return (
    <div
      data-tm-stage
      className="relative mx-auto flex aspect-[4/5] w-full max-w-lg items-center justify-center [transform-style:preserve-3d]"
    >
      {/* Procedural WebGL layer (desktop + WebGL + no reduced-motion only). */}
      {enable3d ? <TechForgeCanvasGate root={root} /> : null}

      {/* Champagne rim glow behind the garment. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--color-highlight) 26%, transparent), transparent 70%)',
        }}
      />

      {/* CSS engineered platform — always present (also the WebGL-off fallback). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[10%] left-1/2 h-[24%] w-[78%] -translate-x-1/2"
      >
        <div className="absolute inset-0 rounded-[50%] border border-[var(--color-line)] bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-highlight)_14%,transparent),transparent_70%)]" />
        <div className="absolute inset-[14%] rounded-[50%] border border-[color:var(--color-highlight-soft)]" />
        <div className="absolute inset-[34%] rounded-[50%] border border-[var(--color-line)]" />
      </div>

      {/* Contact shadow grounding the garment on the platform. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[12%] left-1/2 h-[7%] w-[52%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-xl"
      />

      {/* Product render — tilts toward the pointer (2.5D), gently floating. */}
      <div
        ref={tiltRef}
        className="relative z-10 flex h-full w-full items-center justify-center will-change-transform"
      >
        {image ? (
          <img
            src={image}
            alt={alt}
            className="tm-hero-float max-h-[92%] w-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="grid h-[80%] w-[70%] place-items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] text-center text-[color:var(--color-text-muted)]">
            {heroProduct?.name ?? 'Compression shirt'}
          </div>
        )}
      </div>

      {/* Accessible technical hotspots (hidden on small screens — see list below). */}
      <div className="absolute inset-0 hidden lg:block">
        {hotspots.map((h) => (
          <TmHotspot key={h.id} hotspot={h} />
        ))}
      </div>
    </div>
  )
}
