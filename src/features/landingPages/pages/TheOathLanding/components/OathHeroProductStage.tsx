import { useRef, useState } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useOathMotionState } from '../motion/oathMotionState'
import {
  FORGE_FIRST_REVEAL_AT,
  FORGE_REVEAL_DURATION,
  FORGE_STRIKE_REVEAL_AT,
} from '../motion/heroForgeTiming'
import { OATH_PRODUCT_ROSTER } from '../content/oathContent.defaults'
import { oathHeroMediaMode, oathHeroProductImages } from '../theOathAssets'

/**
 * DOM half of the hero product forge (hero mode `products`).
 *
 * The ember silhouette renders on the persistent WebGL canvas; this stage owns
 * the **actual product render** and all interaction. Once the embers settle
 * into a product's exact silhouette, the real transparent-PNG render resolves
 * in over it (fade + unblur + heat cool-down) while the particles recede to a
 * faint halo — the product appears to have been forged, not faded in. Clicking
 * anywhere on the panel dissolves the render back into embers, the cloud
 * re-forms the next product's silhouette, and that render resolves in turn.
 * Both trees schedule against the shared forge clock (`heroForgeTiming`), and
 * the reveal state crosses via `motion.heroProductReveal`.
 *
 * The render box mirrors the WebGL fit: PIECE_FIT (2.6) of a 3.64-unit world
 * viewport ⇒ a 71.4svh square whose centre sits 26vw from the right edge —
 * particle form and revealed pixels stay registered 1:1.
 *
 * Renders nothing unless the WebGL layer is live (`data-webgl="on"` on the
 * page root — desktop xl+, motion-consenting, WebGL-capable); mobile/tablet
 * keep the static fallback rendered by `OathHero`.
 */
export function OathHeroProductStage() {
  const motion = useOathMotionState()
  const [index, setIndex] = useState(0)
  const [shownIndex, setShownIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const revealTlRef = useRef<gsap.core.Timeline | null>(null)
  // Strikes stay disarmed until the entry choreography reaches the first
  // reveal — an early click must not resolve a render over the lineup beat.
  const armedRef = useRef(false)
  const images = oathHeroProductImages()

  // Entry reveal: hold the render hidden through the nebula → lineup →
  // converge choreography, then resolve it in as the embers settle.
  const { contextSafe } = useGSAP(
    () => {
      const img = imgRef.current
      if (!img || images.length === 0) return
      // Fusion, not arrival: the render materializes exactly where the embers
      // sit (barely any scale/blur) so the cloud reads as solidifying into it.
      gsap.set(img, { autoAlpha: 0, scale: 1.015, filter: 'blur(6px) brightness(1.9)' })
      const tl = gsap.timeline({ delay: FORGE_FIRST_REVEAL_AT })
      tl.call(
        () => {
          armedRef.current = true
        },
        undefined,
        0,
      )
      tl.to(
        img,
        {
          autoAlpha: 1,
          scale: 1,
          filter: 'blur(0px) brightness(1)',
          duration: FORGE_REVEAL_DURATION,
          ease: 'power2.out',
        },
        0,
      )
      tl.to(
        motion,
        { heroProductReveal: 1, duration: FORGE_REVEAL_DURATION, ease: 'power2.out' },
        0,
      )
      revealTlRef.current = tl
    },
    { scope: stageRef },
  )

  if (oathHeroMediaMode() !== 'products' || images.length === 0) return null

  const roster = OATH_PRODUCT_ROSTER
  const piece = roster[index % roster.length]
  const numeral = String((index % images.length) + 1).padStart(2, '0')
  const total = String(images.length).padStart(2, '0')

  const reforge = contextSafe(() => {
    // Late in the pin the stage has faded (scrub) but still hit-tests —
    // ignore strikes once the hand-off to the creed has begun. Also ignore
    // them before the entry choreography has produced the first reveal.
    if (!armedRef.current || motion.heroProgress > 0.65) return
    const next = (index + 1) % images.length
    setIndex(next)
    motion.heroProductIndex = next
    motion.heroProductStrike += 1

    // Disintegrate the shown render into the ember cloud, swap the source
    // while hidden, then resolve the next render in as its silhouette settles.
    const img = imgRef.current
    if (!img) return
    revealTlRef.current?.kill()
    const tl = gsap.timeline()
    tl.to(
      img,
      {
        // A touch of growth + heat as it breaks apart — disintegration, not
        // a shrink-away fade.
        autoAlpha: 0,
        scale: 1.012,
        filter: 'blur(8px) brightness(1.8)',
        duration: 0.32,
        ease: 'power2.in',
      },
      0,
    )
    tl.to(motion, { heroProductReveal: 0, duration: 0.3, ease: 'power2.in' }, 0)
    tl.call(() => setShownIndex(next), undefined, 0.36)
    tl.fromTo(
      img,
      { autoAlpha: 0, scale: 1.015, filter: 'blur(6px) brightness(1.9)' },
      {
        autoAlpha: 1,
        scale: 1,
        filter: 'blur(0px) brightness(1)',
        duration: FORGE_REVEAL_DURATION,
        ease: 'power2.out',
      },
      FORGE_STRIKE_REVEAL_AT,
    )
    tl.to(
      motion,
      { heroProductReveal: 1, duration: FORGE_REVEAL_DURATION, ease: 'power2.out' },
      FORGE_STRIKE_REVEAL_AT,
    )
    revealTlRef.current = tl
  })

  return (
    <div
      ref={stageRef}
      data-hero-product-stage
      className="absolute inset-y-0 right-0 z-[6] hidden w-[58%] max-w-[920px] xl:group-data-[webgl=on]/oath:block"
    >
      {/* Full-panel strike surface. A real button so the re-forge is keyboard
          reachable; visually silent (the canvas + render carry the piece). */}
      <button
        type="button"
        onClick={reforge}
        onPointerEnter={() => {
          motion.heroProductHover = 1
          setHovered(true)
        }}
        onPointerLeave={() => {
          motion.heroProductHover = 0
          setHovered(false)
        }}
        aria-label={`${piece?.name ?? `Piece ${numeral}`} — strike to re-forge the next piece`}
        data-cursor="view"
        className="focus-ring absolute inset-0 h-full w-full cursor-pointer bg-transparent"
      />

      {/* The actual product render — resolved in over the settled ember form.
          Square 71.4svh box centred 26vw from the right edge = the WebGL
          piece's world fit/anchor, so pixels and particles stay registered. */}
      <div
        data-hero-product-render
        aria-hidden="true"
        className="pointer-events-none absolute [filter:drop-shadow(0_36px_70px_rgba(0,0,0,0.5))]"
        style={{
          width: '71.4svh',
          height: '71.4svh',
          right: '26vw',
          top: 'calc(50% - 1.4svh)',
          transform: 'translate(50%, -50%)',
        }}
      >
        <div
          className="h-full w-full transition-transform duration-700 ease-out will-change-transform"
          style={{ transform: hovered ? 'scale(1.035)' : 'scale(1)' }}
        >
          <img
            ref={imgRef}
            src={images[shownIndex % images.length]}
            alt=""
            className="h-full w-full object-contain opacity-0 will-change-[transform,opacity,filter]"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>

      {/* Active piece plate — crossfades on re-forge (key remount + entry
          animation), bottom-right so it never collides with the left copy. */}
      <div
        key={index}
        aria-hidden="true"
        className="oath-hero-piece-label pointer-events-none absolute bottom-[16%] right-[6%] text-right"
      >
        <p className="anvl-display text-[10px] tracking-[0.34em] text-[var(--color-highlight-bright)]">
          {numeral} / {total}
        </p>
        <p className="anvl-heading mt-1.5 text-2xl font-normal leading-none text-[var(--color-heading)] 2xl:text-3xl">
          {piece?.name ?? `Piece ${numeral}`}
        </p>
        {piece?.role ? (
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            {piece.role}
          </p>
        ) : null}
        {images.length > 1 ? (
          <p className="anvl-display mt-3 text-[9px] tracking-[0.4em] text-[color:color-mix(in_oklab,var(--color-text)_55%,transparent)]">
            Strike to re-forge
          </p>
        ) : null}
      </div>
    </div>
  )
}
